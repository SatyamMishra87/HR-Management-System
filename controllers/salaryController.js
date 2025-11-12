import Salary from "../models/salary.js";
import EmployeeSalarySlip from "../models/EmployeeSalarySlip.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/auth.js";
dotenv.config();
import { istStartOfDayToUTC, istEndOfDayToUTC } from "../utils/time.js";
import { ENUMS } from "../utils/constants.js";
import SalaryCalculationfunction from "../utils/salaryCalculation.js";
import { generateSalarySlipPDF } from "../utils/generateSalarySlipPdf.js";
import { exportSalaryExcel } from "../utils/exportSalaryExcel.js";
const salaryController = async ({ type, data }, callback) => {
    try {
        const { token } = data;
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decode.id);
        if (!user) return callback({ success: false, error: "User not found" });
        console.log(user);

        switch (type) {
            case "createSalarySlip": {
                if (user.role !== "admin") return callback({ success: false, error: "Only Admin can create salary slip" });

                const { userId, startDate, endDate, salary, frequencyType } = data;
                if (!userId || !startDate || !salary || !frequencyType) {
                    return callback({ success: false, error: "fields are required" });
                }

                if (![ENUMS.salaryFrequency.MONTHLY, ENUMS.salaryFrequency.WEEKLY, ENUMS.salaryFrequency.DAILY, ENUMS.salaryFrequency.HOURLY].includes(frequencyType)) {
                    return callback({ success: false, error: "invalid frequency Type" });
                }
                const userdetails = await User.findById(userId);
                if (!userdetails) return callback({ success: false, error: "User not found for this Id" });

                const start = istStartOfDayToUTC(startDate);
                const end = endDate ? istEndOfDayToUTC(endDate) : istEndOfDayToUTC(startDate);
                if (end < start)
                    return callback({ success: false, error: "endDate cannot be before startDate" });

                const overlapSalary = await Salary.findOne({
                    userId,
                    $or: [
                        { startDate: { $lte: end }, endDate: { $gte: start } }
                    ]
                });
                console.log('overlapSalary', overlapSalary);
                if (overlapSalary) return callback({ success: false, error: "salary already  exists in this range" });
                const NewsalarySlip = await Salary.create({
                    userId,
                    startDate: start,
                    endDate: end,
                    salary,
                    frequencyType,
                    createdBy: user._id
                });
                return callback({ success: true, message: "salary slip created successfully", NewsalarySlip });
            }

            case "getSalarySlips": {
                let { userId } = data;
                if (!Array.isArray(userId)) userId = [userId]
                let filter = {};
                if (user?.role !== "admin") {
                    filter.userId = user._id;
                } else if (userId) {
                    filter.userId = userId;
                }

                const slips = await Salary.find({ userId: { $in: filter.userId } })
                return callback({ success: true, slips });
            }

            case "salryCalculate": {

                const { userId, year, month } = data;
                const monthStart = new Date(Date.UTC(year, month - 1, 1));
                const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

                console.log("monthStart :", monthStart);
                console.log("monthEnd :", monthEnd);
                const salaryConfigs = await Salary.find({
                    userId,
                    $or: [
                        { startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } },
                        { startDate: { $lte: monthEnd }, endDate: null },
                    ],
                });

                if (!salaryConfigs.length) {
                    return callback({ success: false, error: "No salary record found for this month" });
                }

                const salaryRecords = [];

                for (const s of salaryConfigs) {
                    const salaryDetails = await SalaryCalculationfunction(userId, s.startDate, s.endDate, s.salary);

                    if (!salaryDetails) return callback({ success: false, error: "Salary details not found" });

                    console.log("salaryDetails", salaryDetails);

                    salaryRecords.push({
                        salaryId: s._id,
                        startDate: s.startDate,
                        endDate: s.endDate,
                        frequencyType: s.frequencyType || ENUMS.salaryFrequency.MONTHLY,
                        grossSalary: s.salary,
                        perDaySalary: salaryDetails.perDaySalary,
                        totalWorkingDays: salaryDetails.totalWorkingDays,
                        presentDays: salaryDetails.presentDays,
                        absentDays: salaryDetails.absentDays,
                        paidLeaveDays: salaryDetails.paidLeaveDays,
                        unpaidLeaveDays: salaryDetails.unpaidLeaveDays,
                        holidays: salaryDetails.countHolidays,
                        weekends: salaryDetails.countWeekends,
                        payableDays: salaryDetails.payableDays,
                        unpaidDeduction: salaryDetails.unpaidDeduction,
                        earlyOutTimeDeductionDays: salaryDetails.earlyOutTimeDeductionDays,
                        totalOvertimeAmount: salaryDetails.totalOvertimeAmount,
                        grossEarnings: salaryDetails.grossEarnings
                    });
                }

                const totals = salaryRecords.reduce(
                    (acc, r) => {
                        acc.totalGrossSalary += Number(r.grossSalary,)
                        acc.totalWorkingDays += Number(r.totalWorkingDays) || 0;
                        acc.totalPresentDays += Number(r.presentDays) || 0;
                        acc.totalAbsentDays += Number(r.absentDays) || 0;
                        acc.totalPaidLeaveDays += Number(r.paidLeaveDays) || 0;
                        acc.totalUnpaidLeaveDays += Number(r.unpaidLeaveDays) || 0;
                        acc.totalHolidays += Number(r.holidays) || 0;
                        acc.totalWeekends += Number(r.weekends) || 0;
                        acc.totalEarlyOutTimeDeductionDays += r.earlyOutTimeDeductionDays || 0;
                        acc.totalPayableDays += Number(r.payableDays) || 0;
                        acc.totalOvertimeAmount += Number(r.totalOvertimeAmount || 0);
                        acc.totalGrossEarnings += r.grossEarnings || 0;
                        return acc;
                    },
                    {
                        totalGrossSalary: 0,
                        totalWorkingDays: 0,
                        totalPresentDays: 0,
                        totalAbsentDays: 0,
                        totalPaidLeaveDays: 0,
                        totalUnpaidLeaveDays: 0,
                        totalHolidays: 0,
                        totalWeekends: 0,
                        totalEarlyOutTimeDeductionDays: 0,
                        totalPayableDays: 0,
                        totalOvertimeAmount: 0,
                        totalGrossEarnings: 0,
                    }
                );
                console.log(totals);

                const basic = totals.totalGrossSalary * 0.5;
                const HRA = basic * 0.4;
                const DA = basic * 0.1;
                const otherAllowances = totals.totalGrossSalary - (basic + HRA + DA);

                const earnings = {
                    basic,
                    HRA,
                    DA,
                    otherAllowances,
                };

                // Statutory deductions
                const proratedBasic = (basic / totals.totalWorkingDays) * totals.totalPayableDays;
                const proratedDA = (DA / totals.totalWorkingDays) * totals.totalPayableDays;

                const pf = (proratedBasic + proratedDA) * 0.12;
                const esi = totals.totalGrossEarnings <= 21000 ? totals.totalGrossEarnings * 0.0075 : 0;
                const tax = totals.totalGrossEarnings > 25000 ? totals.totalGrossEarnings * 0.05 : 0;
                const otherDeductions = 0;

                const grossDeductions = pf + esi + tax;

                const deductions = {
                    pf,
                    esi,
                    tax,
                    otherDeductions,
                };

                const netSalary = Math.max(0, totals.totalGrossEarnings - grossDeductions);

                console.log(`\n Net salary: ${netSalary.toFixed(2)}`);
                const slip = await EmployeeSalarySlip.findOneAndUpdate(
                    { userId, year, month },
                    {
                        $set: {
                            userId,
                            year,
                            month,
                            salaryRecords,
                            ...totals,
                            earnings,
                            deductions,
                            totalGrossDeductions: grossDeductions,
                            totalNetSalary: netSalary,
                        },
                    },
                    { upsert: true, new: true, runValidators: true }
                );

                console.log("Salary Slip Saved:", slip);

                return callback({ success: true, data: slip });
            }

            case "downloadSalarySlip": {
                const { userId, year, month } = data;
                const slip = await EmployeeSalarySlip.findOne({ userId, year, month }).populate("userId");
                console.log(slip)
                if (!slip) return callback({ success: false, error: "No salary slip found" });

                const filePath = await generateSalarySlipPDF(slip, slip.userId);
                return callback({ success: true, filePath });
            }

            case "exportSalarySlip": {
                const { year, month } = data;
                const slips = await EmployeeSalarySlip.find({ year, month }).populate("userId");

                if (!slips || slips.length === 0)
                    return callback({ success: false, error: "No salary slips found" });

                const filePath = await exportSalaryExcel(slips, month, year);
                return callback({ success: true, filePath });
            }

            default: {
                return callback({ success: false, error: "invalid action type" });
            }
        }
    } catch (error) {
        console.error("salaryController Error", error.message);
        return callback({ success: false, error: "Internal Server Error", message: error.message });
    }
}

export default salaryController;

