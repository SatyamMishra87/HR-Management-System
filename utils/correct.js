import User from "../models/auth.js";
import Shift from "../models/Shift.js";
import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import LeaveApplication from "../models/leaveApplication.js";
import PaySchedule from "../models/paySchedule.js";
import OvertimePolicy from "../models/overTimePolicy.js";
import { getUTCRangeForISTDate, sameDay } from "../utils/time.js";
import { ENUMS } from "./constants.js";

const SalaryCalculationfunction = async (userId, startDate, endDate, grossSalary) => {
    if (!userId || !startDate || !endDate) throw new Error("userId, startDate and endDate are required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const shift = await Shift.findOne({ assignUsers: userId });
    if (!shift) throw new Error("User not assigned to any shift");

    const holidays = await Holiday.find({
        assignUsers: userId,
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });
    console.log("holiday", holidays)

    const leaveApplication = await LeaveApplication.find({
        userId,
        status: ENUMS.statusType.APPROVED,
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    }).populate("leavePolicyId");

    console.log("leaveapplication", leaveApplication)

    const attendance = await Attendance.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
        clockIn: { $ne: null },
    });

    console.log("attendance", attendance);

    const paySchedule = await PaySchedule.findOne({ locationId: user.locationId });
    if (!paySchedule) throw new Error("PaySchedule not found for user's location");

    let overtimePolicy = null;
    if (user.assignedOvertimePolicy) {
        overtimePolicy = await OvertimePolicy.findById(user.assignedOvertimePolicy).lean();
    }
    console.log("overtime Policy", overtimePolicy);


    const startutcmidnight = new Date(new Date(startDate).getTime() + 5.5 * 60 * 60 * 1000);
    const endutcmidnight = new Date(endDate.getTime());

    let presentDays = 0,
        totalWorkingDays = 0,
        countWeekends = 0,
        countHolidays = 0,
        absentDays = 0,
        paidLeaveDays = 0,
        unpaidLeaveDays = 0,
        earlyOutDeductionDays = 0;

    for (let curdate = startutcmidnight.getTime(); curdate <= endutcmidnight.getTime(); curdate += 24 * 60 * 60 * 1000) {
        const curDateObj = new Date(curdate);
        console.log(curDateObj)
        const y = curDateObj.getUTCFullYear();
        const m = curDateObj.getUTCMonth() + 1;
        const d = curDateObj.getUTCDate();
        const { startUTC, endUTC } = getUTCRangeForISTDate(y, m, d);

        const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        console.log(dayOfWeek)
        const shiftDay = shift.days.get(String(dayOfWeek));

        if (shiftDay && shiftDay.dayStatus === ENUMS.DAY_STATUS.WEEKEND) {
            countWeekends++;
            continue;
        }

        const isHoliday = holidays.some(h => startUTC <= h.endDate && endUTC >= h.startDate);
        if (isHoliday) {
            countHolidays++;
            continue;
        }

        totalWorkingDays++;

        let leaveFraction = 0,
            isPaidLeave = false,
            isUnpaidLeave = false;
        // let otSecondsWorking = 0,
        //     otSecondsWeekend = 0,
        //     otSecondsHoliday = 0;

        for (let lp of leaveApplication) {
            const policy = lp.leavePolicyId;
            const leaveDay = lp.leaveDays.find(lday => sameDay(lday.date, startUTC));
            if (leaveDay) {
                leaveFraction = leaveDay.leaveType === ENUMS.leaveType.FULL ? 1 : 0.5;
                if (policy.policyType === ENUMS.leavePolicyType.paidLeave) isPaidLeave = true;
                else if (policy.policyType === ENUMS.leavePolicyType.unpaidLeave) isUnpaidLeave = true;
                break;
            }
        }

        const dayAttendance = attendance.find(a => a.date >= startUTC && a.date <= endUTC);
        console.log("dayattendance", dayAttendance);
        const shiftSeconds =
            shiftDay?.dayStatus === ENUMS.DAY_STATUS.FIRSTHALF || shiftDay?.dayStatus === ENUMS.DAY_STATUS.SECONDHALF
                ? (shift.halfDayHrs || 5) * 3600
                : (shift.fullDayHrs || 8) * 3600;

        // let totalOvertimeSeconds = 0;

        // if (overtimePolicy && dayAttendance?.ExtraTime && Number(dayAttendance.ExtraTime) > 0) {
        //     const extraSeconds = Number(dayAttendance.ExtraTime || 0);
        //     console.log("extra sec", extraSeconds)
        //     if (isHoliday) otSecondsHoliday += extraSeconds;
        //     else if (shiftDay && shiftDay.dayStatus === ENUMS.DAY_STATUS.WEEKEND) otSecondsWeekend += extraSeconds;
        //     else otSecondsWorking += extraSeconds;

        //     if (paySchedule.payForExtraTime) {
        //         if (overtimePolicy.payFactorType === ENUMS.payFactorType.MULTIPLIER) {

        //             const multiplier =
        //                 isHoliday
        //                     ? overtimePolicy.holidayMultiplier ?? 1.5
        //                     : (shiftDay && shiftDay.dayStatus === ENUMS.DAY_STATUS.WEEKEND)
        //                         ? overtimePolicy.weekendMultiplier ?? 1
        //                         : overtimePolicy.workingMultiplier ?? 0.5;

        //             console.log("multiplier", multiplier);

        //             // otAmountForDay = extraSeconds * perSecondBaseForDay * multiplier;
        //         } else if (overtimePolicy.payFactorType === ENUMS.payFactorType.FIXED_TOTAL) {
        //             const perSecondFixed = (overtimePolicy.fixedTotal || 0) / 3600;
        //             otAmountForDay = extraSeconds * perSecondFixed;
        //         }

        //         totalOvertimeAmount += otAmountForDay;
        //         totalOvertimeSeconds += extraSeconds;
        //     }



        // }

        if (dayAttendance && dayAttendance.isEarlyOut) {
            const earlyOutSeconds = Number(dayAttendance.EarlyOutDuration || 0);
            const graceSeconds = (paySchedule.earlyOutGraceMinutes) * 60;

            console.log("ealyoutsec", earlyOutSeconds);
            console.log("graceSec", graceSeconds);
            let deductionSeconds = 0;
            if (paySchedule.payForEarlyOutWithinGrace) {
                console.log("payschedule payForEarlyOutWithinGrace true")
                if (earlyOutSeconds > graceSeconds) deductionSeconds = earlyOutSeconds - graceSeconds;
            } else {
                deductionSeconds = earlyOutSeconds;
                console.log("deductionSeconds", deductionSeconds);
            }
            const deductionDays = Math.min(deductionSeconds / (shiftSeconds || 1), 1);;
            if (deductionDays >= 0.5) {

                presentDays += 0.5;
                absentDays += 0.5;
                console.log("deduction days >= 0.5 ", presentDays)
                earlyOutDeductionDays += deductionDays; // deduct half day
            } else {

                presentDays += 1;
                console.log("underealyrout presentdasys", presentDays)
                earlyOutDeductionDays += deductionDays;
                console.log("earlyoutdeductiondays", earlyOutDeductionDays)
            }


        } else {
            if (leaveFraction === 1) {
                if (isPaidLeave) {
                    console.log("paidleave++ leavefraction 1 ")
                    paidLeaveDays += 1;
                }
                else if (isUnpaidLeave) unpaidLeaveDays += 1;
                else absentDays += 1;
            } else if (leaveFraction === 0.5) {
                if (dayAttendance) {
                    console.log("leavefraction 0.5 presentdays+= 0.5")
                    presentDays += 0.5;
                }
                else absentDays += 0.5;
                if (isPaidLeave) paidLeaveDays += 0.5;
                else if (isUnpaidLeave) unpaidLeaveDays += 0.5;
                continue;
            } else {
                if (dayAttendance) {
                    presentDays += 1;
                    console.log("presentdays++")
                    console.log(presentDays)
                }
                else absentDays += 1;
            }
        }
    }

    const basic = grossSalary * 0.5;
    const HRA = basic * 0.4;
    const DA = basic * 0.1;
    const otherAllowances = grossSalary - (basic + HRA + DA);

    const perDaySalary = grossSalary / (totalWorkingDays || 1);
    // const perSecondBase = grossSalary / (totalWorkingDays * 8 * 3600);
    // let totalOvertimeSeconds = otSecondsWorking + otSecondsWeekend + otSecondsHoliday;
    // let totalOvertimeAmount = 0;

    // if (totalOvertimeSeconds > 0 && overtimePolicy) {
    //     const pfType = overtimePolicy.payFactorType;
    //     if (pfType === ENUMS.payFactorType.MULTIPLIER) {
    //         totalOvertimeAmount =
    //             (otSecondsWorking * perSecondBase * (overtimePolicy.workingMultiplier || 0.5)) +
    //             (otSecondsWeekend * perSecondBase * (overtimePolicy.weekendMultiplier || 1)) +
    //             (otSecondsHoliday * perSecondBase * (overtimePolicy.holidayMultiplier || 1.5));
    //     } else if (pfType === ENUMS.payFactorType.FIXED_TOTAL) {
    //         const perSecondFixed = (overtimePolicy.fixedTotal || 0) / 3600;
    //         totalOvertimeAmount = totalOvertimeSeconds * perSecondFixed;
    //     }
    // }


    const payableDays =
        presentDays +
        paidLeaveDays +
        (paySchedule.payForWeekends ? countWeekends : 0) +
        (paySchedule.payForHolidays ? countHolidays : 0);

    const grossEarnings = perDaySalary * payableDays;


    // let totalOvertimeSeconds = otSecondsWorking + otSecondsWeekend + otSecondsHoliday;
    // let totalOvertimeAmount = 0;

    // if (totalOvertimeSeconds > 0) {
    //     const pfType = overtimePolicy.payFactorType;

    //     if (pfType === ENUMS.payFactorType.MULTIPLIER) {
    //         const mWorking = overtimePolicy.workingMultiplier ?? 0.5;
    //         const mWeekend = overtimePolicy.weekendMultiplier ?? 1;
    //         const mHoliday = overtimePolicy.holidayMultiplier ?? 1;

    //         totalOvertimeAmount =
    //             (otSecondsWorking * perSecondBase * mWorking) +
    //             (otSecondsWeekend * perSecondBase * mWeekend) +
    //             (otSecondsHoliday * perSecondBase * mHoliday);
    //     } else if (pfType === ENUMS.payFactorType.FIXED_TOTAL) {
    //         const perSecondFixed = (overtimePolicy.fixedTotal || 0) / 3600;
    //         totalOvertimeAmount = totalOvertimeSeconds * perSecondFixed;
    //     }
    // }

    const earnings = {
        basic,
        HRA,
        DA,
        otherAllowances,
        grossEarnings
    }

    //Deductions 
    const proratedBasic = (basic / totalWorkingDays) * payableDays;
    console.log("proratedBasic", proratedBasic)
    const proratedDA = (DA / totalWorkingDays) * payableDays;

    const pf = (proratedBasic + proratedDA) * 0.12;
    const esi = grossEarnings <= 21000 ? grossEarnings * 0.0075 : 0;
    const tax = grossEarnings > 25000 ? grossEarnings * 0.05 : 0;
    // const earlyOutDeduction = perDaySalary * earlyOutDeductionDays;
    // const unpaidLeaveDeduction = perDaySalary * unpaidLeaveDays;
    // const absentDeduction = perDaySalary * absentDays;
    const otherDeductions = 0;

    // const totalUnpaidDeduction = unpaidLeaveDeduction + absentDeduction + earlyOutDeduction;

    const grossDeductions = pf + esi + tax + otherDeductions;

    const deductions = {
        pf,
        esi,
        tax,
        otherDeductions,
        grossDeductions
    }

    const totalUnpaidDays = unpaidLeaveDays + absentDays + earlyOutDeductionDays;
    const unpaidDeduction = perDaySalary * totalUnpaidDays;
    const netSalary = Math.max(0, grossEarnings - grossDeductions);

    return {
        totalWorkingDays,
        countWeekends,
        countHolidays,
        presentDays,
        absentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        earlyOutDeductionDays: Number(earlyOutDeductionDays.toFixed(2)),
        totalUnpaidDays,
        perDaySalary: perDaySalary.toFixed(2),
        payableDays,
        unpaidDeduction: unpaidDeduction.toFixed(2),
        earnings,
        deductions,
        netSalary: netSalary.toFixed(2),
    };
};

export default SalaryCalculationfunction;