import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

const leavePolicySchema = new mongoose.Schema({
    leavePolicyName : {type : String , required :true},
    code : {type : String , unique : true , required : true},
    policyType : {type : Number , enum :[ENUMS.leavePolicyType.paidLeave , ENUMS.leavePolicyType.unpaidLeave] , required : true},
    assignUsers : [{type : mongoose.Schema.Types.ObjectId , ref : "User" , default : []}],
    createdBy :{ type: mongoose.Schema.Types.ObjectId, ref: "User" }
} , {timestamps :true})

const LeavePolicy = mongoose.model("LeavePolicy" , leavePolicySchema);
export default LeavePolicy;