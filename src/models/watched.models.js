import mongoose from "mongoose";

const watchedSchema = new mongoose.Schema(
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
    genres: {
      type: [String], // store genres from TMDB
      default: [],
    },
    watchedAt: {
      type: Date, // track when user marked it as watched
      default: Date.now,
    },
  },
  { timestamps: true }
);

watchedSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export const Watched = mongoose.model("Watched", watchedSchema);