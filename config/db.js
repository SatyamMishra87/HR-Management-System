import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const MONGO_URL = process.env.MONGO_URL;
const dbConnect = async()=>{
    try {
       await mongoose.connect(MONGO_URL);
       console.log("DB Connected Successfully")
    } catch (error) {
        console.log("DB Connection failed" , error.message);
        process.exit(1);
    }
}

export default dbConnect