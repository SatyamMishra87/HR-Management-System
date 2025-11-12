import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const socketAuth = (socket, next) => {
  try {
    // Token nikalna (client auth object se bhejega)
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
   

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    const decoded = jwt.verify(token, JWT_SECRET_KEY);

    socket.user = decoded; // yahan id, username, email store ho jayega
   
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
};
