"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Check, Loader2 } from "lucide-react";
import { generateCSVReport, generateExcelXMLReport } from "@/lib/reports";
import type { ComprehensiveReportData } from "@/types/reports";

interface ExportReportModalProps {
  reportData: ComprehensiveReportData;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportReportModal({ reportData, isOpen, onClose }: ExportReportModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    setDownloading("csv");
    try {
      const csvString = generateCSVReport(reportData);
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Sachin_Workflow_Report_${reportData.filters.startDate}_to_${reportData.filters.endDate}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export CSV error:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExcel = () => {
    setDownloading("excel");
    try {
      const xmlString = generateExcelXMLReport(reportData);
      const blob = new Blob([xmlString], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Sachin_Workflow_Report_${reportData.filters.startDate}_to_${reportData.filters.endDate}.xls`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export Excel error:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-navy-950 border border-navy-800 rounded-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-brand-orange" />
            <h3 className="text-base font-semibold text-white">Export Official Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm p-1 rounded hover:bg-navy-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs text-gray-300">
          <p>
            Choose your preferred export format. Reports include executive totals, counsellor breakdowns, university shares, and daily timelines.
          </p>
          <div className="p-3 bg-navy-900 rounded-lg border border-navy-800 space-y-1 text-gray-400">
            <div>
              <span className="text-gray-300 font-medium">Reporting Range:</span>{" "}
              {reportData.filters.startDate} to {reportData.filters.endDate}
            </div>
            <div>
              <span className="text-gray-300 font-medium">Total Counselors:</span>{" "}
              {reportData.counselors.length}
            </div>
            <div>
              <span className="text-gray-300 font-medium">Total Collections:</span>{" "}
              ₹{reportData.summary.totalRevenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Microsoft Excel Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-navy-900 border border-navy-700 hover:border-emerald-600 hover:bg-navy-850 text-white text-xs font-medium transition-all group"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold text-white">Download Microsoft Excel (.xls)</div>
                <div className="text-[11px] text-gray-400">
                  Formatted SpreadsheetML XML with styling and numbers
                </div>
              </div>
            </div>
            {downloading === "excel" ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-gray-400 group-hover:text-emerald-400" />
            )}
          </button>

          {/* RFC-4180 CSV Button */}
          <button
            onClick={handleDownloadCSV}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-navy-900 border border-navy-700 hover:border-blue-500 hover:bg-navy-850 text-white text-xs font-medium transition-all group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold text-white">Download RFC-4180 CSV</div>
                <div className="text-[11px] text-gray-400">
                  Clean tabular comma-delimited data for analytics
                </div>
              </div>
            </div>
            {downloading === "csv" ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
            )}
          </button>

          {/* Print / Save to PDF Button */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-navy-900 border border-navy-700 hover:border-brand-orange hover:bg-navy-850 text-white text-xs font-medium transition-all group"
          >
            <div className="flex items-center gap-3">
              <Printer className="w-4 h-4 text-brand-orange group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold text-white">Print or Save to PDF</div>
                <div className="text-[11px] text-gray-400">
                  Clean browser print dialog ready for physical print or PDF saving
                </div>
              </div>
            </div>
            <Printer className="w-4 h-4 text-gray-400 group-hover:text-brand-orange" />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-navy-900 border border-navy-700 text-xs font-medium text-gray-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
