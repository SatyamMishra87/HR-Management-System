import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: [true, "email is required"] },
    password: { type: String, required: function () { return this.email }, minLength: 8 },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    assignedShift: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", default: null },
    assignedHolidays: [{ type: mongoose.Schema.Types.ObjectId, ref: "Holiday" }],
    assignedOvertimePolicy: { type: mongoose.Schema.Types.ObjectId, ref: "OvertimePolicy" },
    assignedLeavePolicy: [{ type: mongoose.Schema.Types.ObjectId, ref: "LeavePolicy" }],
    locationId : {type :mongoose.Schema.Types.ObjectId  , ref :"Location"}
},
{ timestamps: true });
userSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) return next();
        const saltValue = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, saltValue);
        next();
    } catch (error) {
        next(error);
    }

});

userSchema.methods.comparePassword = async function (pass) {
    return await bcrypt.compare(pass, this.password)
}
const User = mongoose.model("User", userSchema);
export default User;