import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app=express()
app.use(
    cors({
      origin: 'https://movie-pie-frontend-f00b03oe6-utkarsh-raj-patels-projects.vercel.app',
      credentials: true,
    })
  );

app.get("/", (req, res) => {
    res.send("✅ Server is running fine!");
  });
app.use(express.json({limit:"500mb"}))
app.use(express.urlencoded({
    extended:true,limit:"500mb"
}))

//for cookiesx
app.use(cookieParser())

import userRouter from "./routes/user.routes.js";
import watchlistRouter from "./routes/watchlist.routes.js";
import watchedRouter from "./routes/watched.routes.js"

app.use("/api/v1/users",userRouter)     
app.use("/api/v1/playlist",watchlistRouter)
app.use("/api/v1/watched", watchedRouter)

export default app;
