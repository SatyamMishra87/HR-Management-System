import User from "../models/auth.js";
import Location from "../models/location.js";
import validator from "validator";
import { createToken } from "../middlewares/jwt.js"


export const registerUserService = async ({ name , email , password , role ,locationId}) => {

    if (!validator.isEmail(email)) {
        const error = new Error("Email formate is not valid")
        error.statusCode = 400;
        throw error
    };

    if (password.length < 8) {
        const error = new Error("password should be 8 character long");
        error.statusCode = 400;
        throw error
    }
    const existUser = await User.findOne({ email });
    if (existUser) {
        const error = new Error("User already exists");
        error.statusCode = 400;
        throw error
    }
    const location = await Location.findById(locationId);
    if(!location){
        const error = new Error("location not found");
        error.statusCode = 404;
        throw error
    }

    const user = await User({name  , email , password , role ,locationId});
    await user.save();
    return user;

}

export const loginUserService = async ({ email, password }) => {
    if (!email || !password) {
        const error = new Error("email and Password is required")
        error.statusCode = 404;
        throw error
    }
    if (!validator.isEmail(email)) {
        const error = new Error("Email formate is not valid")
        error.statusCode = 400;
        throw error
    };
    if (password.length < 8) {
        const error = new Error("password should be 8 character long");
        error.statusCode = 400;
        throw error
    }
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error("invalid credentials");
        error.statusCode = 404;
        throw error
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        const error = new Error("invalid password");
        error.statusCode = 400;
        throw error
    }

    const token = createToken(user);
   
     const userObj = {
         name: user.name,
        email: user.email,
        role : user.role  
     }
    return { userObj, token };
}


export const profileService = async (email) => {
    const user = await User.findOne({email }).select("name , email , role");
    if (!user) {
        const error = new Error("user not found");
        error.statusCode = 404;
        throw error
    }
    return user;
   
}