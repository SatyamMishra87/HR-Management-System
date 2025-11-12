
import User from "../models/auth.js";
import { registerUserService, loginUserService, profileService } from "../services/authService.js";
export const register = async (req, res, next) => {
    try {
        const user = await registerUserService(req.body);
        res.status(201).json({ msg: "User registration successfully completed", user })
    } catch (error) {
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { userObj, token } = await loginUserService({ email, password });
        res.status(200).json({ msg: 'login successfull', userObj, token })
    } catch (error) {
        next(error)
    }
}

export const profile = async (req, res, next) => {
    try {
        const user = await profileService(req.user.email);
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const { userId, locationId } = req.body;

        const updatuser = await User.findByIdAndUpdate(userId, { locationId: locationId }, { new: true });
        res.status(200).json(updatuser)
    } catch (error) {
        next(error)
    }
}