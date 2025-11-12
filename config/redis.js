import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

export const redisClient = createClient({
    url: process.env.REDIS_URL
});

export const redisConnect = async () => {

    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log("Redis Connected" , process.env.REDIS_URL)
        }
    } catch (error) {
        console.log(error.message);
    }
}


// redisClient.on("connect", () => console.log("Redis Connected"));
redisClient.on("error", (err) => console.error(" Redis Error:", err.message));