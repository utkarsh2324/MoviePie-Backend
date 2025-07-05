import { apierror } from "../utils/apierror.js";
import {asynchandler} from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js"


//this will verify only that user is present or not
export const verifyJWT = asynchandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new apierror(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            throw new apierror(401, "Invalid access token");
        }

        if (!user.isVerified) {
            throw new apierror(403, "Email not verified");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new apierror(401, error?.message || "Invalid Access Token");
    }
});