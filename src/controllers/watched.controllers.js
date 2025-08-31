import { Watched } from "../models/watched.models.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { asynchandler } from "../utils/asynchandler.js";

// ✅ Add to watched
const addToWatched = asynchandler(async (req, res) => {
  const { movieId, title, posterPath, releaseDate, mediaType, genres } = req.body;

  if (!movieId || !title) {
    throw new apierror(400, "movieId and title are required");
  }

  const existing = await Watched.findOne({
    userId: req.user._id,
    movieId,
  });

  if (existing) {
    throw new apierror(409, "Already marked as watched");
  }

  const added = await Watched.create({
    userId: req.user._id,
    movieId,
    title,
    posterPath,
    releaseDate,
    mediaType,
    genres,         // new field
    watchedAt: new Date(), // new field (optional, default is Date.now)
  });

  return res
    .status(201)
    .json(new apiresponse(201, added, "Added to watched list"));
});

// 📌 Get user's watched list
const getUserWatched = asynchandler(async (req, res) => {
  const items = await Watched.find({ userId: req.user._id });

  return res
    .status(200)
    .json(new apiresponse(200, items, "Fetched watched list"));
});

export { addToWatched, getUserWatched };