import React from "react";
import FileList from "./HistorySection/FileList";
import { useTranslation } from "react-i18next";

const HistoryPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <FileList title={t("history.excelFile")} fileExtension="xlsx" />
      <FileList title={t("history.pdfFile")} fileExtension="pdf" />
    </>
  );
};

export default HistoryPage;
