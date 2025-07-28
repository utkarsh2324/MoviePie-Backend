import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: {
      type: String, // TMDB ID as string to support both movies & shows
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
    },
    releaseDate: {
      type: String,
    },
    mediaType: {
      type: String, // "movie" or "tv"
      default: "movie",
    },
  },
  { timestamps: true }
);

watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true }); // prevent duplicates

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);