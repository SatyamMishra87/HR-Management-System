import jwt from "jsonwebtoken";
import User from "../models/auth.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const jwtMiddleware = async(req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        const error = new Error("Unauthorized: No token provided");
        error.statusCode = 401; // Unauthorized
        return next(error); // immediately forward to error middleware
    }

    const [scheme, token] = authHeader.split(" ");

    if (!scheme || scheme !== "Bearer" || !token) {
        const error = new Error("Invalid authorization format");
        error.statusCode = 401;
        return next(error);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "Invalid token" });
        console.log(decoded)
        req.user = decoded; // attach user info to request
        next();
    } catch (err) {
        const error = new Error("Invalid or expired token");
        error.statusCode = 401;
        next(error);
    }
};

export const roleAuth = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user || !roles.includes(req.user.role)) {
                const error = new Error("Forbidden: You don’t have permission");
                error.statusCode = 403;
                return next(error);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};


export const createToken = (userData) => {
    return jwt.sign({
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
    }, JWT_SECRET_KEY)
}
