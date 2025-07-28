import { Router } from "express";
import { addToWatchlist } from "../controllers/watchlist.controllers.js";
import { removeFromWatchlist } from "../controllers/watchlist.controllers.js";
import { getUserWatchlist } from "../controllers/watchlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router();
router.use(verifyJWT);
// POST /api/v1/watchlist
router.route("/watchlist").post(verifyJWT,addToWatchlist);

// DELETE /api/v1/watchlist/:movieId
router.route("/watchlist/:movieId").delete(verifyJWT,removeFromWatchlist);

// GET /api/v1/watchlist
router.route("/watchlist").get(verifyJWT,getUserWatchlist);


export default router;