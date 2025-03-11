import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import "@/style/pages/print.css";
import { Template } from "../templates";
import Accordion from "@/components/ui/Accordion";
import Dropdown from "@/components/ui/dropdown";
import html2pdf from "html2pdf.js";

interface Props {
  filteredData: any[];
  template: Template;
  setIsGenerated: (d: boolean) => void;
  setIsGeneratedAccused: (d: boolean) => void;
  setIsGeneratedStatement: (d: boolean) => void;
  setIsGeneratedRib: (d: boolean) => void;
  setGeneratedAccuseFile: (p: string) => void;
  setGeneratedFile: (p: string) => void;
  setGeneratedStatementFile: (p: string) => void;
  setGeneratedRibFile: (p: string) => void;
}

const small = { width: 847, height: 276 };
const medium = { width: 850, height: 299 };
const big = { width: 847, height: 378 };

const StepFour = ({
  filteredData,
  template,
  setIsGeneratedRib,
  setIsGeneratedStatement,
  setIsGeneratedAccused,
  setIsGenerated,
  setGeneratedAccuseFile,
  setGeneratedFile,
  setGeneratedStatementFile,
  setGeneratedRibFile,
}: Props) => {
  const { t } = useTranslation();

  const [checks, setChecks] = useState<any[]>([]);
  const [accused, setAccused] = useState<any[]>([]);
  const [statements, setStatements] = useState<any[]>([]);
  const [ribs, setRibs] = useState<any[]>([]);
  const [checkPerPage, setCheckPerPage] = useState(1);
  const [statementPerPage, setStatementPerPage] = useState(1);
  const [accusedPerPage, setAccusedPerPage] = useState(1);
  const [ribPerPage, setRibPerPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const visualCheck = (data: "rib" | "statement" | "fields" | "accused") => {
    const infos: any[] = [];
    const fields = JSON.parse(template[data]);

    filteredData.forEach((user, indexs) => {
      const end = Number(user["NOMBRE_CARNET"] * user["NOMBRE_FEULLE"]);
      for (let i = 0; i < end; i++) {
        const checkFields = fields.map(({ nom, x, y }: any) => {
          let value = user[nom];
          if (nom === "series") {
            value = Number(user["NUMERO_DEBUT_CHEQUE"]) + i;
          }
          return { nom, x, y, value };
        });

        infos.push({
          id: `check-${indexs}-${i}`,
          fields: checkFields,
          backgroundImage: template.image, // Set the background image if needed
        });
      }
    });

    if (data === "fields") {
      setChecks(infos);
      return;
    }
    if (data === "statement") {
      setStatements(infos);
      return;
    }
    if (data === "accused") {
      setAccused(infos);
      return;
    }
    if (data === "rib") {
      setRibs(infos);
      return;
    }
  };
  const generatePDF = async (
    data: "rib" | "statement" | "fields" | "accused",
  ) => {
    setIsLoading(true);
    let numChildren = 1;
    let checksContainer = null;
    if (data === "rib") {
      numChildren = ribPerPage;
      checksContainer = document.getElementById("rib-container");
    }
    if (data === "statement") {
      numChildren = statementPerPage;
      checksContainer = document.getElementById("statement-container");
    }
    if (data === "fields") {
      numChildren = checkPerPage;
      checksContainer = document.getElementById("checks-container");
    }
    if (data === "accused") {
      numChildren = accusedPerPage;
      checksContainer = document.getElementById("accused-container");
    }
    // Ensure the number is valid
    if (isNaN(numChildren) || numChildren <= 0) {
      setIsLoading(false);
      alert("Please enter a valid number greater than 0.");
      return;
    }

    checksContainer.style.height = "auto";
    checksContainer.style.overflow = "auto";

    const childElements = Array.from(checksContainer.children);
    // Split the child elements into groups of the specified size
    const groupedChildren = [];
    for (let i = 0; i < childElements.length; i += numChildren) {
      groupedChildren.push(childElements.slice(i, i + numChildren));
    }

    // Create a temporary container for all groups
    const tempContainer = document.createElement("div");

    groupedChildren.forEach((group, index) => {
      // Create a new page container for each group
      const pageContainer = document.createElement("div");
      pageContainer.className = "page"; // Optional: Add a class for styling

      // Add a page break after each group except the last one
      if (index < groupedChildren.length - 1) {
        pageContainer.classList.add("page-break");
      }

      // Append all child elements in the group to the page container
      group.forEach((child) => {
        const clonedChild = child.cloneNode(true) as HTMLElement; // Clone the child to avoid modifying the original DOM
        clonedChild.style.height = "276.6px";
        clonedChild.style.width = "847px";
        clonedChild.style.border = "none";
        pageContainer.appendChild(clonedChild);
      });
      console.log("tempContainer", tempContainer);
      // Append the page container to the temporary container
      tempContainer.appendChild(pageContainer);
    });
    const options = {
      margin: [0, 0, 0, 0], // [top, right, bottom, left] in mm
      filename: `${data}.pdf`,
      //image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        useCORS: true, // Enable CORS to allow external fonts
        scale: 2,
      }, // Scale for better resolution
      jsPDF: {
        unit: "mm", // Use millimeters as the unit
        format: [224, 293], // Custom dimensions: 22.4cm x 29.3cm
      },
    };
    try {
      // Generate the PDF and capture the Blob
      const pdfBlob = await html2pdf()
        .set({ ...options, dpi: 300 })
        .from(tempContainer)
        .outputPdf("blob"); // Explicitly request a Blob

      // Convert the Blob to an ArrayBuffer
      const arrayBuffer = await pdfBlob.arrayBuffer();

      // Generate a unique filename by appending current milliseconds to the filename (without extension)
      const n = options.filename.split(".")[0] + new Date().getMilliseconds();

      // Send the ArrayBuffer to the main process (Electron)
      const result = await window.electronAPI.uploadPDF(arrayBuffer, n);

      if (result.success) {
        setIsLoading(false);
        alert(`${t("errors.uploadedPdf")} ${result.filePath}`);

        if (data === "rib") {
          setIsGeneratedRib(true);
          setGeneratedRibFile(result.filePath);
        }
        if (data === "statement") {
          setIsGeneratedStatement(true);
          setGeneratedStatementFile(result.filePath);
        }
        if (data === "fields") {
          setIsGenerated(true);
          setGeneratedFile(result.filePath);
        }
        if (data === "accused") {
          setIsGeneratedAccused(true);
          setGeneratedAccuseFile(result.filePath);
        }
        checksContainer.style.height = "276.7px";
        checksContainer.style.width = "847px";
        checksContainer.style.overflow = "scroll";
      } else {
        setIsLoading(false);
        alert(`${t("errors.errorUploading")} ${result.error}`);
        checksContainer.style.height = "276.7px";
        checksContainer.style.width = "847px";
        checksContainer.style.overflow = "scroll";
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error generating or uploading PDF:", error);
      alert(t("errors.failedPdf"));
      checksContainer.style.height = "276.6px";
      checksContainer.style.width = "847px";
      checksContainer.style.overflow = "scroll";
    }
  };
  return (
    <div className="step-content" data-step="4">
      <h1>{t("print.stepFourTitle")}</h1>
      <p>1* Visualiser les champs</p>
      <p>2* Séletionner nombre de check par page</p>
      <p className="mb-10">3* Génerer le pdf a imprimer </p>

      <Accordion title={t("button.visualPdf")}>
        <div style={{ marginBottom: "30px" }}>
          <div className="mb-12 flex items-center">
            <button
              className="btn-add mr-4"
              onClick={() => visualCheck("fields")}
            >
              {t("button.visualPdf")}
            </button>
            <Dropdown
              data={[1, 2, 3, 4].map((r) => ({
                title: r.toString(),
                value: r.toString(),
              }))}
              setValue={setCheckPerPage}
              value={checkPerPage}
            />
            <button
              id="generatePDF"
              className="deleteBtn ml-4"
              onClick={() => generatePDF("fields")}
            >
              {t("button.generatePdf")}
            </button>
          </div>
          <pre id="output"></pre>
          <div
            id="checks-container"
            style={{ height: "276px", overflow: "hidden", width: "847px" }}
          >
            {checks.map((check) => (
              <div
                key={check.id}
                className="check-container-print"
                style={{
                  width: `${small.width}px`,
                  height: `${small.height}px`,
                  border: "none",
                }}
              >
                {check.backgroundImage && (
                  <img
                    id="checkBackgroundPrint"
                    className="check-background"
                    src={check.backgroundImage}
                    alt="Check Background"
                  />
                )}
                {check.fields.map((field: any) => (
                  <div
                    key={field.nom}
                    id={field.nom}
                    className="data-field"
                    style={{
                      left: `${field.x}px`,
                      top: `${field.y}px`,
                      fontFamily: field.nom === "CMC7" ? "cmc7" : undefined,
                      fontWeight: field.nom === "CMC7" ? "bold" : undefined,
                      fontSize: field.nom === "CMC7" ? "18px" : undefined,
                    }}
                  >
                    {field.value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Accordion>
      <Accordion title={t("button.visualAccusedPdf")}>
        <div style={{ marginBottom: "30px" }}>
          <div className="mb-12 flex items-center">
            <button
              className="btn-add mr-4"
              onClick={() => visualCheck("accused")}
            >
              {t("button.visualAccusedPdf")}
            </button>
            <Dropdown
              data={[1, 2, 3, 4].map((r) => ({
                title: r.toString(),
                value: r.toString(),
              }))}
              setValue={setAccusedPerPage}
              value={accusedPerPage}
            />
            <button
              className="deleteBtn ml-4"
              onClick={() => generatePDF("accused")}
            >
              {t("button.generatePdf")}
            </button>
          </div>
          <pre id="output"></pre>
          <div
            id="accused-container"
            style={{ height: "276px", overflow: "hidden", width: "847px" }}
          >
            {accused.map((check) => (
              <div
                key={check.id}
                className="check-container-print"
                style={{
                  width: `${small.width}px`,
                  height: `${small.height}px`,
                  border: "none",
                }}
              >
                {check.backgroundImage && (
                  <img
                    id="checkBackgroundPrint"
                    className="check-background"
                    src={check.backgroundImage}
                    alt="Check Background"
                  />
                )}
                {accused.map((e) =>
                  e.fields.map((field: any) => (
                    <div
                      key={field.nom}
                      id={field.nom}
                      className="data-field"
                      style={{
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        fontFamily: field.nom === "CMC7" ? "cmc7" : undefined,
                        fontWeight: field.nom === "CMC7" ? "bold" : undefined,
                        fontSize: field.nom === "CMC7" ? "18px" : undefined,
                      }}
                    >
                      {field.value}
                    </div>
                  )),
                )}
              </div>
            ))}
          </div>
        </div>
      </Accordion>
      <Accordion title={t("button.visualStatementPdf")}>
        <div style={{ marginBottom: "30px" }}>
          <div className="mb-12 flex items-center">
            <button
              className="btn-add mr-4"
              onClick={() => visualCheck("statement")}
            >
              {t("button.visualStatementPdf")}
            </button>
            <Dropdown
              data={[1, 2, 3, 4].map((r) => ({
                title: r.toString(),
                value: r.toString(),
              }))}
              setValue={setStatementPerPage}
              value={statementPerPage}
            />
            <button
              id="generatePDF"
              className="deleteBtn ml-4"
              onClick={() => generatePDF("statement")}
            >
              {t("button.generatePdf")}
            </button>
          </div>
          <pre id="output"></pre>
          <div
            id="statement-container"
            style={{ height: "276px", overflow: "hidden", width: "847px" }}
          >
            {statements.map((check) => (
              <div
                key={check.id}
                className="check-container-print"
                style={{
                  width: `${small.width}px`,
                  height: `${small.height}px`,
                  border: "none",
                }}
              >
                {check.backgroundImage && (
                  <img
                    id="checkBackgroundPrint"
                    className="check-background"
                    src={check.backgroundImage}
                    alt="Check Background"
                  />
                )}
                {statements.map((e) =>
                  e.fields.map((field: any) => (
                    <div
                      key={field.nom}
                      id={field.nom}
                      className="data-field"
                      style={{
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        fontFamily: field.nom === "CMC7" ? "cmc7" : undefined,
                        fontWeight: field.nom === "CMC7" ? "bold" : undefined,
                        fontSize: field.nom === "CMC7" ? "18px" : undefined,
                      }}
                    >
                      {field.value}
                    </div>
                  )),
                )}
              </div>
            ))}
          </div>
        </div>
      </Accordion>
      <Accordion title={t("button.visualRibPdf")}>
        <div style={{ marginBottom: "30px" }}>
          <div className="mb-12 flex items-center">
            <button className="btn-add mr-4" onClick={() => visualCheck("rib")}>
              {t("button.visualRibPdf")}
            </button>
            <Dropdown
              data={[1, 2, 3, 4].map((r) => ({
                title: r.toString(),
                value: r.toString(),
              }))}
              setValue={setRibPerPage}
              value={ribPerPage}
            />
            <button
              id="generatePDF"
              className="deleteBtn ml-4"
              onClick={() => generatePDF("rib")}
            >
              {t("button.generatePdf")}
            </button>
          </div>
          <pre id="output"></pre>
          <div
            id="rib-container"
            style={{ height: "276px", overflow: "hidden", width: "847px" }}
          >
            {ribs.map((check) => (
              <div
                key={check.id}
                className="check-container-print"
                style={{
                  width: `${small.width}px`,
                  height: `${small.height}px`,
                  border: "none",
                }}
              >
                {check.backgroundImage && (
                  <img
                    id="checkBackgroundPrint"
                    className="check-background"
                    src={check.backgroundImage}
                    alt="Check Background"
                  />
                )}
                {ribs.map((e) =>
                  e.fields.map((field: any) => (
                    <div
                      key={field.nom}
                      id={field.nom}
                      className="data-field"
                      style={{
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        fontFamily: field.nom === "CMC7" ? "cmc7" : undefined,
                        fontWeight: field.nom === "CMC7" ? "bold" : undefined,
                        fontSize: field.nom === "CMC7" ? "18px" : undefined,
                      }}
                    >
                      {field.value}
                    </div>
                  )),
                )}
              </div>
            ))}
          </div>
        </div>
      </Accordion>
    </div>
  );
};

export default StepFour;
