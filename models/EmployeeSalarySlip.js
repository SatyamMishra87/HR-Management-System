import mongoose from "mongoose";
import { ENUMS } from "../utils/constants.js";

//  Formulas:
// basic = ~40–50% of grossSalary
// hra = basic * 0.4 (or 0.5 in metro cities)
// da = basic * 0.1

const earningsSchema = new mongoose.Schema({
  basic: { type: Number, required: true },  // usually 40–50% of Gross Salary
  HRA: { type: Number, default: 0 },       // House Rent Allowance
  DA: { type: Number, default: 0 },        // Dearness Allowance
  otherAllowances: { type: Number, default: 0 },

}, { _id: false });

//  Formulas:
// pf = basic * 0.12
// esi = grossEarnings * 0.0075 (only if salary ≤ 21,000)
// tax = grossEarnings * applicableTaxRate (5%, 10%, 20%, etc.)

const deductionsSchema = new mongoose.Schema(
  {
    pf: { type: Number, default: 0 }, // Provident Fund (12% of basic)
    esi: { type: Number, default: 0 }, // Employee State Insurance (0.75%)
    tax: { type: Number, default: 0 }, // TDS / Income tax 
    otherDeductions: { type: Number, default: 0 },
  },
  { _id: false }
);

const salaryRecordSchema = new mongoose.Schema({
  salaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salary",
    required: true,
  },

  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  frequencyType: {
    type: String,
    enum: [ENUMS.salaryFrequency.MONTHLY, ENUMS.salaryFrequency.WEEKLY, ENUMS.salaryFrequency.DAILY, ENUMS.salaryFrequency.HOURLY],
    default: ENUMS.salaryFrequency.MONTHLY,
  },
  grossSalary: { type: Number, required: true },

}, { _id: false });

const employeeSalarySlipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },

  salaryRecords: [salaryRecordSchema],

  totalGrossSalary : Number,
  totalWorkingDays: Number,
  totalPresentDays: Number,
  totalAbsentDays: Number,
  totalPaidLeaveDays: Number,
  totalUnpaidLeaveDays: Number,
  totalHolidays: Number,
  totalWeekends: Number,
  totalEarlyOutTimeDeductionDays: { type: Number, required: true },
  totalPayableDays: Number,
  totalOvertimeAmount: Number,
  earnings: earningsSchema,
  deductions: deductionsSchema,
  totalGrossEarnings: { type: Number, default: 0 },
  totalGrossDeductions: { type: Number, default: 0 },
  totalNetSalary: { type: Number, default: 0 },// grossEarnings - grossDeductions


});

employeeSalarySlipSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model("EmployeeSalarySlip", employeeSalarySlipSchema);
