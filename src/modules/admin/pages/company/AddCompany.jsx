"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";

import SingleAddCompanyForm from "../../components/company/SingleAddCompanyForm";

import { bulkUploadCompanies } from "../../../../api/admin/adminCompanyAPI";

import { UserPlus, Upload, Download, CheckCircle } from "lucide-react";

import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const AddCompany = () => {
  const [mode, setMode] = useState("single");
  const [bulkFile, setBulkFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const REQUIRED_COLUMNS = [
    "Company Name",
    "Company Email",
    "Contact Number",
    "Industry",
    "GST",
    "Contact Person Name",
  ];

  const normalizeHeader = (header) => header?.toString().trim().toLowerCase();

  const validateColumns = (headers) => {
    const normalizedHeaders = headers.map(normalizeHeader);

    return REQUIRED_COLUMNS.every((col) =>
      normalizedHeaders.includes(normalizeHeader(col)),
    );
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    setBulkFile(null);

    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();

    // ONLY EXCEL FILES ALLOWED
    if (!["xlsx", "xls"].includes(extension)) {
      Swal.fire({
        icon: "error",
        title: "Invalid file type",
        text: "Please upload only Excel files.",
      });

      return;
    }

    // EXCEL VALIDATION
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheetName = workbook.SheetNames[0];

      const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
      });

      const headers = worksheet[0] || [];

      // if (!validateColumns(headers)) {
      //   Swal.fire({
      //     icon: "error",
      //     title: "Invalid File Format",

      //     html: `
      //       <div style="text-align:left">
      //         <p><strong>Required Columns:</strong></p>
      //         <ul>
      //           ${REQUIRED_COLUMNS.map(
      //             (col) => `<li>${col}</li>`
      //           ).join("")}
      //         </ul>
      //       </div>
      //     `,
      //   });

      //   return;
      // }

      setBulkFile(file);

      Swal.fire({
        icon: "success",
        title: "File validated",
        text: "Your Excel file format is correct.",
      });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      Swal.fire({
        icon: "error",
        title: "No file selected",
        text: "Please select a file to upload.",
      });

      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", bulkFile);

      Swal.fire({
        title: "Uploading...",
        text: "Please wait while companies are uploaded.",
        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await bulkUploadCompanies(formData);

      if (response?.status === 500) {
        Swal.fire({
          icon: "error",
          title: "Bulk Upload Failed",
          width: 700,

          html: `
      <div style="
        text-align:left;
        max-height:420px;
        overflow-y:auto;
        padding-right:4px;
      ">
        ${response.data.errors
          .map(
            (item) => `
              <div style="
                margin-bottom:18px;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:14px;
                overflow:hidden;
              ">
                
                <div style="
                  background:#f9fafb;
                  padding:12px 16px;
                  border-bottom:1px solid #e5e7eb;
                  font-size:15px;
                  font-weight:600;
                  color:#111827;
                ">
                  Row ${item.row}
                </div>

                <div style="padding:10px 14px;">
                  ${item.errors
                    .map(
                      (err) => `
                        <div style="
                          display:flex;
                          align-items:flex-start;
                          gap:8px;
                          padding:8px 0;
                          border-bottom:1px solid #f3f4f6;
                          font-size:14px;
                          color:#4b5563;
                        ">
                          <span style="
                            color:#ef4444;
                            font-size:16px;
                            line-height:1;
                          ">
                            •
                          </span>

                          <span>${err}</span>
                        </div>
                      `,
                    )
                    .join("")}
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    `,
        });

        return;
      }

      Swal.fire({
        icon: "success",
        title: "Upload Successful",

        text: response?.message || "Companies uploaded successfully.",
      });

      setBulkFile(null);
      setFileInputKey(Date.now());
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",

        text:
          error?.response?.data?.message ||
          "Something went wrong while uploading.",
      });
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 w-full overflow-y-auto"
    >
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">
        Add New Company
      </h1>

      <p className="text-sm text-slate-500 mb-6">
        Fill in the details below to create a new company account or upload
        multiple companies at once.
      </p>

      {/* Tabs */}
      <motion.div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => handleModeChange("single")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              mode === "single"
                ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                : "text-slate-600"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <UserPlus size={18} />
              <span>Single Add</span>
            </div>
          </button>

          <button
            onClick={() => handleModeChange("bulk")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              mode === "bulk"
                ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                : "text-slate-600"
            }`}
          >
            <div className="flex items-center justify-center space-x-4">
              <Upload size={18} />
              Bulk Upload
            </div>
          </button>
        </div>
      </motion.div>

      {mode === "single" && <SingleAddCompanyForm />}

      {mode === "bulk" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-[22px] shadow-sm border border-gray-200 p-8 mt-6"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Bulk Upload Companies
            </h2>

            <p className="text-slate-600 max-w-2xl mx-auto">
              Upload an Excel file to add multiple companies at once.
            </p>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-6 hover:border-blue-400 transition-colors duration-200 bg-gray-50/50">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

            <p className="text-lg font-medium text-slate-700 mb-2">
              {bulkFile ? bulkFile.name : "Choose file"}
            </p>

            <p className="text-sm text-gray-500 mb-4">
              {bulkFile ? "File selected successfully" : "Excel files only"}
            </p>

            <label className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors inline-block">
              Browse Files
              <input
                key={fileInputKey}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <button
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleBulkUpload}
              disabled={!bulkFile}
            >
              <Upload className="w-4 h-4" />

              {bulkFile ? `Upload ${bulkFile.name}` : "Upload File"}
            </button>

            <a
              href="https://anytimework.in/anytimework/storage/app/public/excel-import/company_bulk_upload_sample.xlsx"
              download
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </a>
          </div>

          {/* File Status */}
          {bulkFile && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />

                <div>
                  <p className="font-medium text-green-800">
                    File Ready for Upload
                  </p>

                  <p className="text-sm text-green-600">
                    {bulkFile.name} ({(bulkFile.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddCompany;
