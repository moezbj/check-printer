// src/components/Stepper.tsx
import React, { useEffect, useState } from "react";
import StepOne from "./PrintSections/StepOne";
import StepTwo from "./PrintSections/StepTwo";
import StepThree from "./PrintSections/StepThree";
import StepFour from "./PrintSections/StepFour";
import StepFive from "./PrintSections/StepFive";
import { useTranslation } from "react-i18next";

import "@/style/pages/print.css";
import { Template } from "./templates";
const Stepper: React.FC = () => {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [fileData, setFileData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [template, setTemplate] = useState<Template>();

  const [isGenerated, setIsGenerated] = useState(false);
  const [isGeneratedAccused, setIsGeneratedAccused] = useState(false);
  const [isGeneratedStatement, setIsGeneratedStatement] = useState(false);
  const [isGeneratedRib, setIsGeneratedRib] = useState(false);

  const [code, setCode] = useState("");

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [format, setFormat] = useState<string>("");
  const [generatedFile, setGeneratedFile] = useState("");
  const [generatedAccuseFile, setGeneratedAccuseFile] = useState("");
  const [generatedStatementFile, setGeneratedStatementFile] = useState("");
  const [generatedRibFile, setGeneratedRibFile] = useState("");
  const [pathFile, setPathFile] = useState("");
  const [printer, setPrinter] = useState("");

  const steps = [
    { id: 1, title: `${t("print.stepOne")}` },
    { id: 2, title: `${t("print.stepTwo")}` },
    { id: 3, title: `${t("print.stepThree")}` },
    { id: 4, title: `${t("print.stepFour")}` },
    { id: 5, title: `${t("print.stepFive")}` },
  ];

  const handleNext = () => {
    //if (currentStep < steps.length) setCurrentStep(currentStep + 1);
    function hasSameCodeTransaction(dataArray: any) {
      if (dataArray.length === 0) return true; // Empty array case
      // Get the 'Code Transaction' value from the first element
      const firstCodeTransaction = dataArray[0]["CODE_TRANSACTION"];
      // Use 'every' to check if all elements have the same 'Code Transaction'
      return dataArray.every(
        (item: any) => item["CODE_TRANSACTION"] === firstCodeTransaction,
      );
    }

    if (currentStep < steps.length) {
      if (currentStep === 1) {
        setCurrentStep(currentStep + 1);
        return; // Stop further execution after handling step 1
      }
      if (currentStep === 2) {
        const a = filteredData.length > 0 ? filteredData : fileData;
        const result = hasSameCodeTransaction(a);
        if (!result) {
          alert(t("errors.transactionCode"));
          return false; // Stop execution if the condition fails
        }
        if (!fileData.length) {
          alert(t("errors.noData"));
          return false; // Stop execution if the condition fails
        } else {
          setCurrentStep(currentStep + 1);
          return; // Stop further execution after handling step 2
        }
      }
      if (currentStep === 3) {
        if (!template) {
          alert("select template ");
          return false; // Stop execution if the condition fails
        } else {
          setCurrentStep(currentStep + 1);
          return; // Stop further execution after handling step 3
        }
      }
      if (currentStep === 4) {
        if (
          isGenerated ||
          isGeneratedAccused ||
          isGeneratedStatement ||
          isGeneratedRib
        ) {
          setCurrentStep(currentStep + 1);
          return;
        } else {
          // Stop further execution after handling step 4
          alert("generate  PDF ");
          return false;
        }
      } else {
        setCurrentStep(currentStep + 1);

        return;
      }
    }
    if (currentStep === 5 && isDownloaded) {
      setCurrentStep(1);
      localStorage.removeItem("filteredData");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  useEffect(() => {
    const getFile = async () => {
      if (localStorage.getItem("file_id")) {
        const fileName = localStorage.getItem("file_id");
        const getFileExtension = JSON.parse(fileName).name.split(".")[1];
        if (getFileExtension === "pdf") {
          const files = await window.electronAPI.fetchUploadedPDFFile(
            JSON.parse(fileName).name,
          );

          if (fileName.includes("accused")) {
            setGeneratedAccuseFile(files.filePath);
            setIsGeneratedAccused(true);
          }
          if (fileName.includes("statement")) {
            setGeneratedStatementFile(files.filePath);
            setIsGeneratedStatement(true);
          }
          if (fileName.includes("rib")) {
            setGeneratedRibFile(files.filePath);
            setIsGeneratedRib(true);
          }
          if (fileName.includes("fields")) {
            setGeneratedFile(files.filePath);
            setIsGenerated(true);
          }
          setCurrentStep(5);
        } else {
          const files = await window.electronAPI.fetchUploadedFile(
            JSON.parse(fileName).name,
          );
          setPathFile(files.filePath);
          setFileData(files.data);
          setFilteredData(files.data);
          // generateTable();
        }

        localStorage.removeItem("file_id");
      }
    };
    getFile();
  });
  return (
    <div className="stepper-container">
      <ul className="stepper-navigation">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`step ${currentStep === step.id ? "active" : ""}`}
            data-step={step.id}
          >
            {step.title}
          </li>
        ))}
      </ul>
      <div className="stepper-content">
        {currentStep === 1 && <StepOne setCurrentStep={setCurrentStep} />}
        {currentStep === 2 && (
          <StepTwo
            format={format}
            setFormat={setFormat}
            fileData={fileData}
            setFileData={setFileData}
            setFilteredData={setFilteredData}
            setPathFile={setPathFile}
            filteredData={filteredData}
            setCode={setCode}
            code={code}
          />
        )}
        {currentStep === 3 && (
          <StepThree setTemplate={setTemplate} template={template} />
        )}
        {currentStep === 4 && (
          <StepFour
            template={template}
            filteredData={filteredData}
            setIsGenerated={setIsGenerated}
            setIsGeneratedStatement={setIsGeneratedStatement}
            setIsGeneratedAccused={setIsGeneratedAccused}
            setIsGeneratedRib={setIsGeneratedRib}
            setGeneratedFile={setGeneratedFile}
            setGeneratedAccuseFile={setGeneratedAccuseFile}
            setGeneratedStatementFile={setGeneratedStatementFile}
            setGeneratedRibFile={setGeneratedRibFile}
          />
        )}
        {currentStep === 5 && (
          <StepFive
            generatedFile={generatedFile}
            generatedAccuseFile={generatedAccuseFile}
            generatedRibFile={generatedRibFile}
            generatedStatementFile={generatedStatementFile}
            isGenerated={isGenerated}
            isGeneratedAccused={isGeneratedAccused}
            isGeneratedStatement={isGeneratedStatement}
            isGeneratedRib={isGeneratedRib}
            printer={printer}
            setPrinter={setPrinter}
            setIsDownloaded={setIsDownloaded}
            isDownloaded={isDownloaded}
          />
        )}
      </div>
      {currentStep > 1 && (
        <div className="stepper-buttons">
          <button
            id="prevBtn"
            disabled={currentStep === 1}
            onClick={handlePrev}
          >
            {t("button.previous")}
          </button>
          <button
            id="nextBtn"
            disabled={currentStep === steps.length}
            onClick={handleNext}
          >
            {t("button.next")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Stepper;
