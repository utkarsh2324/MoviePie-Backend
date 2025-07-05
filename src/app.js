import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express()
app.use(cors({
    origin:process.env.cors_origin,
    credentials:true
}))
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
app.use("/api/v1/users",userRouter)     

export default app;
