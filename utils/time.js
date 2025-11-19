
export const IST_OFFSET_MIN = 5 * 60 + 30; // 5:30 hours

export const getAttendanceDate = (date = new Date()) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60 * 1000);
  console.log("ist" , ist)
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();
  const midnightISTinUTCms = Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MIN * 60 * 1000;

  return new Date(midnightISTinUTCms);
};

// Current UTC date
export const getCurrentUTC = (date = new Date()) => date;

// Duration in seconds
export const durationInSeconds = (start, end) =>
  Math.floor((new Date(end) - new Date(start)) / 1000);

export const getShiftStartUTC = (shiftTimeStr, attendanceDateUTC) => {
  let time = shiftTimeStr.trim();
  let modifier = null;

  if (time.toUpperCase().includes("AM") || time.toUpperCase().includes("PM")) {
    [time, modifier] = time.split(" ");
    modifier = modifier.toUpperCase();
  }

  let [hours, minutes] = time.split(":").map(Number);

  // 12-hour to 24-hour conversion
  if (modifier) {
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
  }
  const istDate = new Date(attendanceDateUTC.getTime() + IST_OFFSET_MIN * 60 * 1000);  // utc ko ist me convert kiya taki aaj ka date ban jaye

  console.log("before set hour ", istDate);
  istDate.setUTCHours(hours, minutes, 0, 0); // set shift time in IST
  console.log("after set hour ", istDate);
  const shiftStartUTC = new Date(istDate.getTime() - IST_OFFSET_MIN * 60 * 1000); // shift ke end and start ki value set karne ke baad fir se use utc me convert kar liya

  console.log("shiftDay.start string:", shiftTimeStr);
  console.log("Calculated shiftStartUTC in iso string form:", shiftStartUTC.toISOString());

  return shiftStartUTC;
};

export const getShiftEndUTC = (shiftEndStr, attendanceDateUTC) => {
  return getShiftStartUTC(shiftEndStr, attendanceDateUTC);
};

export const calculateLateIn = (shiftStartUTC, currentTimeUTC, graceMinutes = 15) => {
  const graceMillis = graceMinutes * 60 * 1000;
  const maxAllowed = new Date(shiftStartUTC.getTime() + graceMillis);
  console.log("maxAllowedTime", maxAllowed);
  console.log("current time", currentTimeUTC);
  if (currentTimeUTC.getTime() > maxAllowed.getTime()) {
    return {
      lateIn: true,
      lateInDuration: Math.floor((currentTimeUTC.getTime() - maxAllowed.getTime()) / 1000),
    };
  }
  return { lateIn: false, lateInDuration: 0 };
};

export const checkEarlyOut = (currentTimeUTC, shiftEnd, graceMinutes = 10) => {
  const graceMillis = graceMinutes * 60 * 1000;
  const minAllowedClockOut = new Date(shiftEnd.getTime() - graceMillis);
  console.log("min", minAllowedClockOut);
  console.log("current time", currentTimeUTC);
  if (currentTimeUTC < minAllowedClockOut) {
    return {
      earlyOut: true,
      earlyOutDuration: Math.floor((minAllowedClockOut - currentTimeUTC) / 1000),
    };
  }
  return { earlyOut: false, earlyOutDuration: 0 };
};


export function istStartOfDayToUTC(dateStr) {
  const istDate = new Date(`${dateStr}T00:00:00+05:30`);
  return istDate;
}

export function istEndOfDayToUTC(dateStr) {
  const istDate = new Date(`${dateStr}T23:59:59.999+05:30`);
  return istDate;
}

export function utcToISTString(utcDate) {
  return new Date(utcDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

export const toISTDateString = (d) => {
  const t = new Date(d).getTime() + 5.5 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
};
export const sameDay = (d1, d2) => toISTDateString(d1) === toISTDateString(d2);

export const getUTCRangeForISTDate = (y, m, d) => {
  const istMidnightUTCms = Date.UTC(y, m - 1, d, 0, 0, 0) - 5.5 * 60 * 60 * 1000;
  const startUTC = new Date(istMidnightUTCms);
  
  const endUTC = new Date(istMidnightUTCms + 24 * 60 * 60 * 1000 - 1);
  return { startUTC, endUTC };
};

export const parseYMD = (s) => {
  const [y, mm, dd] = s.split("-").map(Number);
  console.log("y" , y , "m", mm , "d",dd);
  return { y, m: mm, d: dd };
};


 // Convert UTC to IST ===
// function convertUTCToIST(date) {
//   const IST_OFFSET = -330; // minutes
//   return new Date(date.getTime() - (IST_OFFSET * 60 * 1000));
// }

// const utcDate = new Date(); // Assume this is UTC
// const istDate = convertUTCToIST(utcDate);

// console.log("UTC :", utcDate.toISOString());
// console.log("IST :", istDate.toISOString());



 // Function to get the attendance date at midnight IST==== 
// const IST_OFFSET_MIN = 330; // IST is UTC +5:30 ,  330 = 5*60 + 30 = 5.5 hours in minutes
//  const getAttendanceDate = (date = new Date()) => {
//   const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60 * 1000);
//   console.log("ist" , ist)
//   const y = ist.getUTCFullYear();
//   console.log("y" , y)
//   const m = ist.getUTCMonth();
//     console.log("m" , m)
//   const d = ist.getUTCDate();
//     console.log("d" , d)
//   const midnightISTinUTCms = Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MIN * 60 * 1000;
//   console.log("midnightISTinUTCms" , midnightISTinUTCms)

//   return new Date(midnightISTinUTCms);
// };

// const attendanceDate = getAttendanceDate();
// console.log("Attendance Date (IST Midnight in UTC):", attendanceDate.toISOString());  // 2025-11-18T18:30:00.000Z  