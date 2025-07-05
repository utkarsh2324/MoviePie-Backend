import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser, verifyOtp ,loginUser,loggedOutUser} from "../controllers/user.controllers.js";
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

export default router;