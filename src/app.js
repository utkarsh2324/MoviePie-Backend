import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app=express()
app.use(
    cors({
      origin: 'http://localhost:5173',
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


app.use("/api/v1/users",userRouter)     
app.use("/api/v1/playlist",watchlistRouter)


export default app;
