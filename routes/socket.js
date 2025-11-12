import shiftController from "../controllers/shiftController.js";
import AttendanceController from "../controllers/AttendanceController.js";
import HolidayController from "../controllers/HolidayController.js";
import overtimePolicyController from "../controllers/overtimePolicyController.js";
import leavePolicyController from "../controllers/leavePolicyController.js";
import leaveApplicationController from "../controllers/leaveApplicationController.js";
import salaryController from "../controllers/salaryController.js";
import payScheduleController from "../controllers/payScheduleController.js";
import locationController from "../controllers/locationController.js";
import PenalisationPolicyController from "../controllers/penalisationController.js";


const controllerMap = {
  assignShift: shiftController,
  unassignShift: shiftController,
  create: shiftController,
  read: shiftController,
  clockIn: AttendanceController,
  clockOut: AttendanceController,
  getAttendance: AttendanceController,
  breakIn: AttendanceController,
  breakOut: AttendanceController,
  clockOut: AttendanceController,
  createHoliday: HolidayController,
  assignHoliday: HolidayController,
  createOverTimePolicy: overtimePolicyController,
  assignOverTimePolicy: overtimePolicyController,
  unassignOverTimePolicy: overtimePolicyController,
  createLeavePolicy: leavePolicyController,
  assignLeavePolicy: leavePolicyController,
  createLeaveApplication: leaveApplicationController,
  approvLeave: leaveApplicationController,
  createSalarySlip : salaryController,
  getSalarySlips : salaryController,
  calculateSalaryDetails :salaryController,
  salryCalculate : salaryController,
  downloadSalarySlip : salaryController,
  createLocation:locationController,
  createPaySchedule :payScheduleController,
  exportSalarySlip:salaryController,
  createPenalisationPolicy : PenalisationPolicyController


};

export const socketRoutes = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("request", async (payload) => {
      try {
        console.log("Incoming payload:", payload);

        const controller = controllerMap[payload.type];
        if (!controller) {
          return socket.emit("response", {
            success: false,
            error: "Invalid request type",
          });
        }

        await controller(payload, (response) => {
          socket.emit("response", response);
        });
      } catch (err) {
        socket.emit("response", { success: false, error: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(` User disconnected: ${socket.id}`);
    });
  });
};
