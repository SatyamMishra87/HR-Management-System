import express from "express";
import { register , login, profile ,updateUser} from "../controllers/authController.js";
import { jwtMiddleware , roleAuth } from "../middlewares/jwt.js";

const router = express.Router();
router.post("/register" , register);
router.post("/login" , login);
router.get("/profile" ,jwtMiddleware, roleAuth("admin" , "user"), profile);
router.post("/updateUser" , updateUser);

export default router;

