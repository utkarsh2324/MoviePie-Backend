import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser, verifyOtp ,loginUser,
    loggedOutUser,forgotPasswordRequest,resetPassword,
    resetverifyOtp,changeCurrentPassword,getCurrentUser,
    updateAccountDetails,updateUserAvatar} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Router } from "express";

// Multer setup for file uploads (avatar)


const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
    ])
    ,registerUser)
router.post("/verify-otp", verifyOtp);
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,loggedOutUser)
router.route("/forgotPassword-otp").post(forgotPasswordRequest);
router.route("/resetverify-otp").post(resetverifyOtp);
router.route("/resetpassword").post(resetPassword);
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar")
.patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

export default router;