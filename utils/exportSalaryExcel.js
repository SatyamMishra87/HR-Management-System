import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const exportSalaryExcel = async (salaryDocs, month, year) => {
  try {
    if (!salaryDocs || !Array.isArray(salaryDocs) || salaryDocs.length === 0) {
      throw new Error("No salary data provided for export");
    }

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Payroll System";
    workbook.lastModifiedBy = "System";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet(`Salary Register ${month}-${year}`, {
      properties: { tabColor: { argb: "FF4472C4" } },
      pageSetup: {
        paperSize: 9, // A4
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    const headers = [
      { key: "empId", header: "Employee ID", width: 20 },
      { key: "empName", header: "Employee Name", width: 25 },
      { key: "email", header: "Email", width: 30 },
      { key: "month", header: "Month", width: 12 },
      { key: "year", header: "Year", width: 10 },
      { key: "frequency", header: "Frequency", width: 15 },
      { key: "grossSalary", header: "Total Gross Salary", width: 18 },
      { key: "basic", header: "Basic (Total)", width: 15 },
      { key: "hra", header: "HRA (Total)", width: 15 },
      { key: "da", header: "DA (Total)", width: 15 },
      { key: "otherAllowances", header: "Other Allowances", width: 18 },
      { key: "overtimeAmount", header: "Overtime Amount", width: 18 }, // From slip level
      { key: "grossEarnings", header: "Gross Earnings", width: 18 },
      { key: "pf", header: "PF (Total)", width: 15 },
      { key: "esi", header: "ESI (Total)", width: 15 },
      { key: "tax", header: "Tax (Total)", width: 15 },
      { key: "otherDeductions", header: "Other Deductions", width: 18 },
      { key: "totalDeductions", header: "Total Deductions", width: 18 },
      { key: "netSalary", header: "Net Salary", width: 18 },
      { key: "workingDays", header: "Working Days", width: 15 },
      { key: "presentDays", header: "Present Days", width: 15 },
      { key: "absentDays", header: "Absent Days", width: 15 },
      { key: "paidLeave", header: "Paid Leave", width: 15 },
      { key: "unpaidLeave", header: "Unpaid Leave", width: 15 },
      { key: "earlyOut", header: "Early Out Days", width: 15 },
      { key: "holidays", header: "Holidays", width: 12 },
      { key: "weekends", header: "Weekends", width: 12 },
      { key: "payableDays", header: "Payable Days", width: 15 },
      { key: "recordCount", header: "Records Count", width: 15 },
      { key: "periods", header: "Salary Periods", width: 35 }
    ];

    sheet.columns = headers;

    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      };
    });

    salaryDocs.forEach((slip, index) => {
      const user = slip.userId || {};

      const agg = {
        grossSalarySum: 0,
        basic: 0,
        HRA: 0,
        DA: 0,
        otherAllowances: 0,
        grossEarnings: 0,
        pf: 0,
        esi: 0,
        tax: 0,
        otherDeductions: 0,
        grossDeductions: 0,
        netSalary: 0,
      };

      const periods = [];
      const frequencySet = new Set();

      const records = slip.salaryRecords || [];

      records.forEach((rec) => {
        const e = rec.earnings || {};
        const d = rec.deductions || {};

        // Aggregate earnings
        agg.grossSalarySum += Number(rec.grossSalary || 0);
        agg.basic += Number(e.basic || 0);
        agg.HRA += Number(e.HRA || 0);
        agg.DA += Number(e.DA || 0);
        agg.otherAllowances += Number(e.otherAllowances || 0);
        agg.grossEarnings += Number(e.grossEarnings || 0);

        // Aggregate deductions
        agg.pf += Number(d.pf || 0);
        agg.esi += Number(d.esi || 0);
        agg.tax += Number(d.tax || 0);
        agg.otherDeductions += Number(d.otherDeductions || 0);
        agg.grossDeductions += Number(d.grossDeductions || 0);

        agg.netSalary += Number(rec.netSalary || 0);

        const startDate = rec.startDate ? new Date(rec.startDate).toLocaleDateString("en-GB") : "";
        const endDate = rec.endDate ? new Date(rec.endDate).toLocaleDateString("en-GB") : "";
        if (startDate && endDate) periods.push(`${startDate}→${endDate}`);

        if (rec.frequencyType) frequencySet.add(String(rec.frequencyType));
      });

      const frequencyLabel = frequencySet.size > 0 ? Array.from(frequencySet).join(", ") : "N/A";

      const rowData = {
        empId: user?._id || "N/A",
        empName: user?.name || "N/A",
        email: user?.email || "N/A",
        month: slip.month || month || "",
        year: slip.year || year || "",
        frequency: frequencyLabel,
        grossSalary: agg.grossSalarySum,
        basic: agg.basic,
        hra: agg.HRA,
        da: agg.DA,
        otherAllowances: agg.otherAllowances,
        overtimeAmount: Number(slip.totalOvertimeAmount || 0), // FROM SLIP LEVEL
        grossEarnings: agg.grossEarnings,
        pf: agg.pf,
        esi: agg.esi,
        tax: agg.tax,
        otherDeductions: agg.otherDeductions,
        totalDeductions: agg.grossDeductions,
        netSalary: agg.netSalary,
        workingDays: slip.totalWorkingDays ?? 0,
        presentDays: slip.totalPresentDays ?? 0,
        absentDays: slip.totalAbsentDays ?? 0,
        paidLeave: slip.totalPaidLeaveDays ?? 0,
        unpaidLeave: slip.totalUnpaidLeaveDays ?? 0,
        earlyOut: slip.totalEarlyoutDeductionDays ?? 0,
        holidays: slip.totalHolidays ?? 0,
        weekends: slip.totalWeekends ?? 0,
        payableDays: slip.totalPayableDays ?? 0,
        recordCount: records.length,
        periods: periods.filter(Boolean).join("; ") || "N/A"
      };

      const addedRow = sheet.addRow(rowData);
      addedRow.height = 20;

     
      if (index % 2 === 0) {
        addedRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F9FA" }
          };
        });
      }


      for (let col = 7; col <= 19; col++) {
        const cell = addedRow.getCell(col);
        cell.numFmt = '₹#,##0.00';
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      
      for (let col = 20; col <= 28; col++) {
        const cell = addedRow.getCell(col);
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }


      [1, 2, 3, 4, 5, 6, 29, 30].forEach(col => {
        addedRow.getCell(col).alignment = { horizontal: "left", vertical: "middle" };
      });

   
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } }
        };
      });
    });


    const startRow = 2;
    const endRow = sheet.rowCount;

    if (endRow >= startRow) {
      const totalRow = sheet.addRow({});
      totalRow.height = 25;

      // Merge cells A to F for label
      const totalRowNum = endRow + 1;
      sheet.mergeCells(`A${totalRowNum}:F${totalRowNum}`);

      const labelCell = totalRow.getCell(1);
      labelCell.value = "GRAND TOTAL";
      labelCell.font = { bold: true, size: 12, color: { argb: "FF000000" } };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      labelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD966" } // Golden yellow
      };
      labelCell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
        left: { style: "medium" },
        right: { style: "medium" }
      };

      const sumColumns = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

      sumColumns.forEach((colNum) => {
        const cell = totalRow.getCell(colNum);
        const colLetter = String.fromCharCode(64 + colNum);
        cell.value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` };
        cell.numFmt = '₹#,##0.00';
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" }
        };
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "thin" },
          right: { style: "thin" }
        };
      });

      // Style remaining cells
      for (let col = 20; col <= 30; col++) {
        const cell = totalRow.getCell(col);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" }
        };
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "thin" },
          right: { style: "thin" }
        };
      }
    }

    // Freeze panes (first 3 columns and header row)
    sheet.views = [{ state: "frozen", xSplit: 3, ySplit: 1 }];

    // Save file
    const dir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Salary_Register_${month}_${year}_${timestamp}.xlsx`;
    const filePath = path.join(dir, fileName);

    await workbook.xlsx.writeFile(filePath);

    console.log(` Excel exported successfully: ${filePath}`);
    console.log(` Total Records: ${salaryDocs.length}`);

    return filePath;

  } catch (err) {
    console.error(" Export Error:", err.message);
    throw new Error(`Failed to export salary Excel: ${err.message}`);
  }
};