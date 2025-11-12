  import User from "../models/auth.js";
  import jwt from "jsonwebtoken";
  import dotenv from "dotenv";
  dotenv.config();
  export const verifyToken = async(token)=>{
    if (!token) throw Error("Token is required" );
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decode.id);
    if (!user) throw Error("User not found")  ;
    console.log("user", user)
    return user;
  }

  
