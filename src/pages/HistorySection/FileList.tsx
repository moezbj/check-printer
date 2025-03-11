import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../../style/pages/history.css";
interface FileListProps {
  title: string;
  fileExtension: "xlsx" | "pdf" | "xls";
}
interface UploadedFile {
  name: string;
  path: string;
}

const FileList: React.FC<FileListProps> = ({ title, fileExtension }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);

  // Fetch uploaded files from Electron API
  const refreshUploadedFiles = async () => {
    try {
      const fetchedFiles = await window.electronAPI.fetchUploadedFiles();
      const r = fetchedFiles.filter(
        (file) => file.name.split(".")[1] === fileExtension,
      );
      setFiles(r);
      setFilteredFiles(r);
    } catch (error) {
      console.error("Error fetching uploaded files:", error.message);
    }
  };
  // Format file date
  const getFileDate = (fileName: string): string => {
    const datePart = fileName.split("|")[1]?.split(".")[0];
    if (!datePart) return "";
    const [year, month, day] = datePart.split("-");
    return `${day}-${month}-${year}`;
  };
  // Format selected date
  const formatDate = (date: string): string => {
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  // Handle file item click
  const handleFileItemClick = (file: UploadedFile) => {
    localStorage.setItem("file_id", JSON.stringify(file));
    if (file.name.endsWith(".pdf")) {
      localStorage.setItem("steeper", "3");
    }
    navigate("/print");
  };

  // Handle file deletion
  const handleDeleteFile = async (file: UploadedFile) => {
    try {
      const result = await window.electronAPI.deleteFile(file.path);
      if (result.success) {
        alert(t("errors.deletedFile"));
        refreshUploadedFiles(); // Refresh the list after deletion
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error.message);
      alert(`Error: ${error.message}`);
    }
  };
  useEffect(() => {
    refreshUploadedFiles();
  }, []);
  // Filter files by date
  function filter(date: string) {
    const f = files.filter((file) => {
      const fileDate = getFileDate(file.name);
      return  fileDate === date;
    });
    setFilteredFiles(f);
  }
  return (
    <div className="file-list">
      <h1 className="text-left">{title}</h1>
      <div className="date-filter-container">
        <label htmlFor={`${fileExtension}Filter`}>
          {t("history.filterByDate")}
        </label>
        <input
          type="date"
          id={`${fileExtension}Filter`}
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            filter(e.target.value);
          }}
        />
      </div>
      <div>
        {filteredFiles.map((file) => (
          <div
            key={file.name}
            className={`file-item`}
            onClick={() => handleFileItemClick(file)}
            data-date={getFileDate(file.name)}
          >
            <span className={`file-name`}>{file.name}</span>
            <button
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFile(file);
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
