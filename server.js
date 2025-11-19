import {createApp} from "./app.js";
import http from "http";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import { redisConnect } from "./config/redis.js";
import initSocket from "./sockets/initSocket.js";
import { socketRoutes } from "./routes/socket.js";

dotenv.config();

const PORT = process.env.PORT;

(async () => {
    try {
        await dbConnect();
        await redisConnect();
        const app = createApp();
        const httpServer = http.createServer(app);
       const  io =  initSocket(httpServer)
       socketRoutes(io);
        httpServer.listen(PORT, () => {
            console.log(`server is running on ${PORT}`)
        })
    } catch (error) {
        console.log("error during server start and db connect");
        process.exit(1);
    }

})();
