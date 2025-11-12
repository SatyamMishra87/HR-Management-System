import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import open from "open";
import { dir } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("__dirname",__dirname)

export const generateSalarySlipPDF = async (salarySlip, user) => {
console.log("__dirname",__dirname)
    const dirPath = path.join(__dirname, "../salary_slips");
    console.log("dirpath",dirPath)
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });

    const filePath = path.join(__dirname, `../salary_slips/salary_slip_${user.name}_${salarySlip.month}_${salarySlip.year}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc
        .fontSize(20)
        .fillColor("#333333")
        .text("Ultimate Business Systems Pvt. Ltd.", { align: "center" })
        .moveDown(0.5);
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthName = monthNames[parseInt(salarySlip.month) - 1];

    doc
        .fontSize(14)
        .fillColor("#555555")
        .text(`Salary Slip -${monthName} ${salarySlip.year}`, { align: "center" })
        .moveDown(1);

    doc.fontSize(12).fillColor("black");
    doc.text(`Employee Name: ${user.name}`);
    doc.text(`Employee ID: ${user._id}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Month: ${salarySlip.month}/${salarySlip.year}`);
    doc.moveDown(1);

    doc.fontSize(13).text("Salary Details", { underline: true }).moveDown(0.5);

    const addRow = (label, value) => {
        doc.fontSize(12).text(`${label}: ${value}`);
    };

    addRow("Base Salary", salarySlip.salaryRecords[0]?.baseSalary || 0);
    addRow("Total Working Days", salarySlip.totalWorkingDays);
    addRow("Present Days", salarySlip.totalPresentDays);
    addRow("Paid Leave Days", salarySlip.totalPaidLeaveDays);
    addRow("Unpaid Leave Days", salarySlip.totalUnpaidLeaveDays);
    addRow("Holidays", salarySlip.totalHolidays);
    addRow("Weekends", salarySlip.totalWeekends);
    addRow("Payable Days", salarySlip.totalPayableDays);
    addRow("Total Net Salary", `INR ${salarySlip.totalNetSalary}`);

    doc.moveDown(2);

    doc.text("Authorized Signature:", { align: "right" }).moveDown(1);
    doc.text("__________________________", { align: "right" });
    doc.text("HR / Payroll Manager", { align: "right" });

    doc.end();

    // Wait until the file is fully written
    await new Promise((resolve) => writeStream.on("finish", resolve));

    console.log("PDF generated at:", filePath);
    await open(filePath);
    return filePath;
};
