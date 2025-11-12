export const ENUMS = {
  LOG_TYPE: {
    WORK: 1,
    BREAK: 2,
    OVERTIME: 3
  },
  DAY_STATUS: {
    WORKING: 1,
    WEEKEND: 2,
    FIRSTHALF: 3,
    SECONDHALF: 4,
    HOLIDAY: 5
  },
  payFactorType: {
    MULTIPLIER: 1,
    FIXED_TOTAL: 2
  },
  leavePolicyType: {
    paidLeave: 1,
    unpaidLeave: 2
  },
  leaveType: {
    FULL: 1,
    FIRSTHALF: 2,
    SECONDHALF: 3
  },
  statusType: {
    PENDING: 1,
    APPROVED: 2,
    REJECT: 3,
    REVOKED: 4
  },
  salaryFrequency: {
    MONTHLY: 1,
    WEEKLY: 2,
    DAILY: 3,
    HOURLY: 4
  },
  missingClockOutPenaltyType: {
    AMOUNT: 1,
    LEAVE: 2
  },
  instantPenaltyType: {
    AMOUNT: 1,
    LEAVE: 2
  },
  penaltyRuleType: {
    APPLY_FIRST_HIT: 1,
    LATE_IN: 2,
    EARLY_OUT: 3,
    BOTH: 4
  },
    // 🆕 NEW ENUMS for Attendance
  ATTENDANCE_STATUS: {
    PRESENT: 1,
    ABSENT: 2,
    HOLIDAY: 3,
    WEEKEND: 4
  },

  CREATED_FROM: {
    USER: 1,
    SYSTEM_AUTO_GENERATED: 2
  }
};
