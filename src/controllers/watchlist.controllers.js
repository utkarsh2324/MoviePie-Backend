import { Watchlist } from "../models/watchlist.models.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { asynchandler } from "../utils/asynchandler.js";

// ✅ Add to watchlist
const addToWatchlist = asynchandler(async (req, res) => {
  const { movieId, title, posterPath, releaseDate, mediaType } = req.body;

  if (!movieId || !title) {
    throw new apierror(400, "movieId and title are required");
  }

  const existing = await Watchlist.findOne({
    userId: req.user._id,
    movieId,
  });

  if (existing) {
    throw new apierror(409, "Already in watchlist");
  }

  const added = await Watchlist.create({
    userId: req.user._id,
    movieId,
    title,
    posterPath,
    releaseDate,
    mediaType,
  });

  return res
    .status(201)
    .json(new apiresponse(201, added, "Added to watchlist"));
});

// ❌ Remove from watchlist
const removeFromWatchlist = asynchandler(async (req, res) => {
  const { movieId } = req.params;

  const removed = await Watchlist.findOneAndDelete({
    userId: req.user._id,
    movieId,
  });

  if (!removed) {
    throw new apierror(404, "Movie not found in watchlist");
  }

  return res
    .status(200)
    .json(new apiresponse(200, null, "Removed from watchlist"));
});


 const getUserWatchlist = asynchandler(async (req, res) => {
  const items = await Watchlist.find({ userId: req.user._id });

  return res
    .status(200)
    .json(new apiresponse(200, items, "Fetched watchlist"));
});

export {
    addToWatchlist, removeFromWatchlist ,getUserWatchlist
}