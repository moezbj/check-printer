// src/components/StepFive.tsx
import React, { useEffect, useState } from "react";
import Dropdown from "@/components/ui/dropdown";
import { useTranslation } from "react-i18next";

import "@/style/pages/print.css";
import { title } from "process";

interface Props {
  generatedFile: string;
  generatedAccuseFile: string;
  generatedRibFile: string;
  generatedStatementFile: string;
  isGeneratedAccused: boolean;
  isGeneratedStatement: boolean;
  isGeneratedRib: boolean;
  isGenerated: boolean;
  printer: string;
  setPrinter: (d: string) => void;
  setIsDownloaded: (d: boolean) => void;
  isDownloaded: boolean;
}

const StepFive = ({
  generatedFile,
  generatedAccuseFile,
  generatedRibFile,
  generatedStatementFile,
  isGenerated,
  isGeneratedAccused,
  isGeneratedStatement,
  isGeneratedRib,
  printer,
  setPrinter,
  isDownloaded,
  setIsDownloaded,
}: Props) => {
  const { t } = useTranslation();
  const [printers, setPrinters] = useState<string[]>([]);
  const [filesToPrint, setFilesToPrint] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isStatementChecked, setIsStatementChecked] = useState<boolean>(false);
  const [isRibChecked, setIsRibChecked] = useState<boolean>(false);
  const [isAccusedChecked, setIsAccusedChecked] = useState<boolean>(false);
  const [checkboxes, setCheckboxes] = useState<
    {
      title: string;
      checked: boolean;
      value: string;
      isGeneratedFile: boolean;
    }[]
  >([
    {
      title: t("print.check"),
      checked: false,
      value: "check",
      isGeneratedFile: isGenerated,
    },
    {
      title: t("print.accused"),
      checked: false,
      value: "accused",
      isGeneratedFile: isGeneratedAccused,
    },
    {
      title: t("print.statement"),
      checked: false,
      value: "statement",
      isGeneratedFile: isGeneratedStatement,
    },
    {
      title: "RIB",
      checked: false,
      value: "rib",
      isGeneratedFile: isGeneratedRib,
    },
  ]);

  const filePath = generatedFile;
  const fileAccusedPath = generatedAccuseFile;
  const fileStatementPath = generatedStatementFile;
  const fileRibPath = generatedRibFile;

  useEffect(() => {
    const detectPrinters = async () => {
      const t = await window.electronAPI.detectPrinters();
      setPrinters(t);
    };
    detectPrinters();
  }, []);
  useEffect(() => {
    // Update checkboxes based on the generated file variables
    setCheckboxes((prevCheckboxes) =>
      prevCheckboxes.map((checkbox, index) => {
        if (index === 0 && isGenerated) {
          filesToPrint.push(filePath);
          return {
            ...checkbox,
            isGeneratedFile: isGenerated,
            checked: isGenerated,
          };
        }
        if (index === 1 && isGeneratedAccused) {
          filesToPrint.push(fileAccusedPath);
          return {
            ...checkbox,
            isGeneratedFile: isGeneratedAccused,
            checked: isGeneratedAccused,
          };
        }
        if (index === 2 && isGeneratedStatement) {
          filesToPrint.push(fileStatementPath);
          return {
            ...checkbox,
            isGeneratedFile: isGeneratedStatement,
            checked: isGeneratedStatement,
          };
        }
        if (index === 3 && isGeneratedRib) {
          filesToPrint.push(fileStatementPath);
          return {
            ...checkbox,
            isGeneratedFile: isGeneratedRib,
            checked: isGeneratedRib,
          };
        }
        return checkbox;
      }),
    );
  }, [isGenerated, isGeneratedAccused, isGeneratedStatement, isGeneratedRib]);

  const onSelect = (value: string) => {
    if (value === "check" && isGenerated) {
      if (isChecked) {
        setIsChecked(false);
        // Create a copy of the current filesToPrint array
        const updatedFiles = [...filesToPrint];
        // Find the index of the file to remove
        const fileIndex = updatedFiles.findIndex((file) => file === filePath);
        // If the file is found, remove it from the array
        if (fileIndex !== -1) {
          updatedFiles.splice(fileIndex, 1); // Remove 1 element at the found index
        }
        // Update the state with the new array (without the removed file)
        setFilesToPrint(updatedFiles);
      } else {
        filesToPrint.push(filePath);
        setIsChecked(true);
      }
    }
    if (value === "accused" && isGeneratedAccused) {
      if (isAccusedChecked) {
        setIsAccusedChecked(false);
        const updatedFiles = [...filesToPrint];
        const fileIndex = updatedFiles.findIndex(
          (file) => file === fileAccusedPath,
        );
        if (fileIndex !== -1) {
          updatedFiles.splice(fileIndex, 1); // Remove 1 element at the found index
        }
        setFilesToPrint(updatedFiles);
      } else {
        filesToPrint.push(fileAccusedPath);
        setIsAccusedChecked(true);
      }
    }
    if (value === "statement" && isGeneratedStatement) {
      if (isStatementChecked) {
        setIsStatementChecked(false);
        const updatedFiles = [...filesToPrint];
        const fileIndex = updatedFiles.findIndex(
          (file) => file === fileStatementPath,
        );
        if (fileIndex !== -1) {
          updatedFiles.splice(fileIndex, 1); // Remove 1 element at the found index
        }
        setFilesToPrint(updatedFiles);
      } else {
        filesToPrint.push(fileStatementPath);
        setIsStatementChecked(true);
      }
    }
    if (value === "rib" && isGeneratedRib) {
      if (isRibChecked) {
        const updatedFiles = [...filesToPrint];
        const fileIndex = updatedFiles.findIndex(
          (file) => file === fileRibPath,
        );
        if (fileIndex !== -1) {
          updatedFiles.splice(fileIndex, 1);
        }
        setFilesToPrint(updatedFiles);
      } else {
        filesToPrint.push(fileRibPath);
        setIsRibChecked(!isRibChecked);
      }
    }
  };
  const print = async () => {
    const printerName = printer;
    if (!printerName) {
      alert(t("errors.selectPrinter"));
      return;
    }
    try {
      if (!filesToPrint.length) {
        alert(t("errors.selectFile"));
        return;
      }
      const result = await window.electronAPI.printPdf(
        filesToPrint.join(";"),
        printerName,
      );
      if (result.success) {
        alert(t("errors.printing"));
      }
      /* document.getElementById("output-result").innerText = JSON.stringify(
        result,
        null,
        2,
      ); */
      setIsDownloaded(true);
    } catch (error) {
      console.error("Error printing PDF:", error);
      document.getElementById("output").innerText = `Error: ${
        error.message || error
      }`;
    }
  };

  return (
    <div className="step-content" data-step="5">
      <h1>{t("print.stepFiveTile")}</h1>
      <div className="flex items-center justify-between">
        <button
          id="check-status-button"
          data-i18n="print.stepFiveStatus"
          style={{ display: "none" }}
          disabled
        >
          Statut
        </button>
        <fieldset className="fieldset-container border border-white">
          <legend>{t("print.fileToPrint")}</legend>
          {checkboxes.map((c) => (
            <div key={c.title}>
              <input
                checked={c.checked}
                type="checkbox"
                name="favorite"
                onChange={() => onSelect(c.value)}
                disabled={!c.isGeneratedFile}
              />
              {c.title}
              <br />
            </div>
          ))}
        </fieldset>
        <div className="flex items-center">
          <Dropdown
            data={printers.map((r) => ({
              title: r.toString(),
              value: r.toString(),
            }))}
            setValue={setPrinter}
            value={printer}
            className="mr-12 !w-80"
          />
          <button
            id="print-pdf-button"
            className="deleteBtn"
            disabled={!printer || filesToPrint.length === 0}
            onClick={print}
          >
            {t("button.print")}
          </button>
        </div>

        <pre id="output-result"></pre>
      </div>
    </div>
  );
};

export default StepFive;
