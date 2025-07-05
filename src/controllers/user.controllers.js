import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import validator from "validator";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendemail.js";
import { generateOtp } from "../utils/generateotp.js";
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new apierror(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("❌ Error in generateAccessTokenAndRefreshToken:", error);  // Add this
        throw new apierror(500, "Something went wrong while generating refresh and access token");
    }
}
// Helper to generate 6-digit OTP

const registerUser = asynchandler(async (req, res) => {
    const { email, userName, password } = req.body;

    // Validate inputs
    if ([ email, userName, password].some(field => !field || field.trim() === "")) {
        throw new apierror(400, "All fields are required");
    }

    if (!validator.isEmail(email)) {
        throw new apierror(409, "Invalid email format");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (existedUser) {
        throw new apierror(409, "User already exists");
    }

    // File upload (avatar only)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new apierror(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new apierror(400, "Avatar upload failed");
    }

    // Generate & hash OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Send OTP via email
    await sendEmail(
        email,
        "Your OTP Code",
        `Your OTP code is ${otp}. It will expire in 10 minutes.`
    );

    // Create user
    const user = await User.create({
        avatar: avatar.url,
        email,
        password,
        userName: userName.toLowerCase(),
        otp: hashedOtp,
        otpExpiry,
        isVerified: false
    });

    return res.status(201).json(
        new apiresponse(200, { userId: user._id, email: user.email }, "OTP sent to your email. Please verify.")
    );
});

 const verifyOtp = asynchandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new apierror(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new apierror(404, "User not found");
    }

    if (!user.otp || !user.otpExpiry) {
        throw new apierror(400, "OTP not requested");
    }

    if (user.otpExpiry < Date.now()) {
        throw new apierror(400, "OTP has expired");
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
        throw new apierror(400, "Invalid OTP");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json(
        new apiresponse(200, null, "Email verified successfully. You can now login.")
    );
});
const loginUser=asynchandler(async(req,res)=>{
    const {email,userName ,password}=req.body
    if(!userName && !email){
        throw new apierror (400,"username or email is required")
    }

   const user= await User.findOne({
        $or: [{email},{userName}]
    })
    if(!user){
        throw new apierror(404,"User does not exist")
    }
    
   const isPasswordValid= await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new apierror(401,"Invalid User Credentials")
    }

   const{accessToken,refreshToken}= await generateAccessTokenAndRefreshToken(user._id)

   const loggedinUser=await User.findById(user._id).
   select("-password  -refreshToken")

   const options={    // we are doing this because from frontend anyone can change the cookies so it will make sure only it will be changed by server
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken)
   .json(
    new apiresponse(200,{
        user:loggedinUser,accessToken,refreshToken
    },
    "User Logged in successfully"
)
   )
})

const loggedOutUser=asynchandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,{
            $set:{                                      //set is a Operator 
                refreshToken:undefined
            }
        },
        {
        new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
       }
    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new apiresponse(200,{},"User logged out successfully"))
})



export{
    generateAccessTokenAndRefreshToken,registerUser,verifyOtp,loginUser,loggedOutUser
}