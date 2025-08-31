import express from "express";
import {
  addToWatched,
  
  getUserWatched,
} from "../controllers/watched.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/add", verifyJWT, addToWatched);

router.get("/", verifyJWT, getUserWatched);

export default router;