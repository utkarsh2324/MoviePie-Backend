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
const loginUser = asynchandler(async(req,res)=>{
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

   const loggedinUser = await User.findById(user._id).select("-password -refreshToken");
   

   const options = {
    httpOnly: true,
    secure: true,        // must be true on production HTTPS
    sameSite: "None",    // allows cross-origin cookies
    maxAge: 7 * 24 * 60 * 60 * 1000 // optional: 7 days
  };

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new apiresponse(200,{
        user:loggedinUser,accessToken,refreshToken
    },
    "User Logged in successfully"
)
   )
})

const loggedOutUser = asynchandler(async(req,res)=>{
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
       res
       .clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "None" })
       .clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" })
       .status(200)
       .json(new apiresponse(200, null, "User logged out successfully"));
   
})
const forgotPasswordRequest = asynchandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new apierror(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new apierror(404, "User not found");
    }

    const otp = generateOtp(); // returns "123456"
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // expires in 10 mins
    user.otpPurpose = 'forgot'; // optional but good practice
    user.canResetPassword = false; // reset flag if any
    await user.save();

    try {
        await sendEmail(
            email,
            "Your OTP Code",
            `Your OTP code is ${otp}. It will expire in 10 minutes.`
        );
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        throw new apierror(500, "Failed to send OTP email");
    }

    return res.status(200).json(
        new apiresponse(200, null, "OTP sent to your email.")
    );
});
const resetverifyOtp = asynchandler(async (req, res) => {
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

    user.canResetPassword = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = undefined;

    await user.save();

    return res.status(200).json(
        new apiresponse(200, null, "OTP verified. You can now reset your password.")
    );
});

const resetPassword = asynchandler(async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        throw new apierror(400, "Email and new password are required");
    }

    const user = await User.findOne({ email });

    if (!user || !user.canResetPassword) {
        throw new apierror(400, "OTP not verified or user does not exist");
    }

    user.password = newPassword; // Let the pre-save hook handle hashing

    user.canResetPassword = false;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = undefined;

    await user.save();

    return res.status(200).json(
        new apiresponse(200, null, "Password reset successfully. You can now log in.")
    );
});
const changeCurrentPassword=asynchandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

   const user =await   User.findById(req.user?._id) 
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new apierror(400,"Invalid password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new apiresponse(
        200,{},
        "Password changed successfully"
    ))

})

//get current user
const getCurrentUser=asynchandler(async(req,res)=>{
    return res
    .status(200)
    .json(new apiresponse(200,req.user,"Current User fetch successfully"))
})
//updating account
const updateAccountDetails=asynchandler(async(req,res)=>{
    const {userName}=req.body
    if(!(userName)){
        throw new apierror(400,"All field are required")
    }

    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                userName:userName,
            }
        },
        {new :true}                 //The information will be made available once the update is completed
    ).select("-password")

    return res
    .status(200)
    .json(new apiresponse(200,user,"Account details updated successfullt"))
})

//updating user Avataer
const updateUserAvatar=asynchandler(async(req,res)=>{
const avatarLocalPath=req.file?.path  
if(!avatarLocalPath){
    throw new apierror(400,"Avatar file is missing")                    //get through multer middleware
}           
const avatar=  await uploadOnCloudinary(avatarLocalPath)   
if(!avatar.url){
    throw new apierror(400,"Error while upload on avatar")
}
const user= await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
).select("-password")

return res
.status(200)
.json(new apiresponse(
    200,
    user,
    "Avatar changed successfully"
))

})


export{
    generateAccessTokenAndRefreshToken,registerUser,verifyOtp,loginUser
    ,loggedOutUser,forgotPasswordRequest,resetPassword,resetverifyOtp,
    changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar
}