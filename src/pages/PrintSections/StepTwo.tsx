// src/components/StepTwo.tsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import "@/style/pages/print.css";
import Dropdown from "@/components/ui/dropdown";

interface PropsTwo {
  format: string;
  setFormat: (d: string) => void;
  fileData: any;
  setFileData: any;
  setFilteredData: any;
  setPathFile: (path: string) => void;
  filteredData: any;
  setCode: (d: string) => void;
  code: string;
}

const StepTwo = ({
  format,
  fileData,
  setFormat,
  setFileData,
  setFilteredData,
  setPathFile,
  filteredData,
  setCode,
  code,
}: PropsTwo) => {
  const { t } = useTranslation();

  const [fileSelected, setFileSelected] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");

  const [paper, setPaper] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(true);
    }
  };
  const handleFileUpload = async () => {
    const selectFormat = format;
    const fileUploaded: {
      success: boolean;
      message: string;
      data: any[];
      error: any;
      filePath: string;
    } = await window.electronAPI.uploadFile(selectFormat);
    if (fileUploaded.success) {
      setPathFile(fileUploaded.filePath);
      setFileData(fileUploaded.data);
      setFilteredData(fileUploaded.data);
      generateTable(fileUploaded.data);
    } else {
      alert(fileUploaded.error);
    }
  };
  function generateTable(file: any[]) {
    if (filteredData.length) {
      const deleteButton = document.getElementById("data-table");
      const filterContainer = document.getElementById("filter-container");

      // Set the file path input field
      const tableBody = document.querySelector("#data-table tbody");
      // Clear existing rows
      tableBody.innerHTML = "";
      deleteButton.style.display = "block";
      // deleteFileButton.style.display = "block";
      filterContainer.style.display = "flex";

      // Populate the table with data
      filteredData.forEach((row: any) => {
        const tr = document.createElement("tr");

        const numeroCompteCell = document.createElement("td");
        numeroCompteCell.classList.add("th-st");
        numeroCompteCell.textContent = row.NUMERO_COMPTE || "N/A";
        tr.appendChild(numeroCompteCell);

        const nomClientCell = document.createElement("td");
        nomClientCell.classList.add("th-st");
        nomClientCell.textContent = row.NOM_CLIENT || "N/A";
        tr.appendChild(nomClientCell);

        const numeroNormalCell = document.createElement("td");
        numeroNormalCell.classList.add("th-st");
        numeroNormalCell.textContent = row.NOMBRE_CARNET || "N/A";
        tr.appendChild(numeroNormalCell);

        const nombreFeuilleCell = document.createElement("td");
        nombreFeuilleCell.classList.add("th-st");
        nombreFeuilleCell.textContent = row.NOMBRE_FEULLE || "N/A";
        tr.appendChild(nombreFeuilleCell);

        const codeTransactionCell = document.createElement("td");
        codeTransactionCell.classList.add("th-st");
        codeTransactionCell.textContent = row.CODE_TRANSACTION || "N/A";
        tr.appendChild(codeTransactionCell);

        const codeBanqueCell = document.createElement("td");
        codeBanqueCell.classList.add("th-st");
        codeBanqueCell.textContent = row.CODE_BANQUE || "N/A";
        tr.appendChild(codeBanqueCell);

        const codeAgenceCell = document.createElement("td");
        codeAgenceCell.classList.add("th-st");
        codeAgenceCell.textContent = row.CODE_AGENCE || "N/A";
        tr.appendChild(codeAgenceCell);

        const codePaysCell = document.createElement("td");
        codePaysCell.classList.add("th-st");
        codePaysCell.textContent = row.CODE_PAYS || "N/A";
        tr.appendChild(codePaysCell);

        const adrClientCell = document.createElement("td");
        adrClientCell.classList.add("th-st");
        adrClientCell.textContent = row.ADR_CLIENT || "N/A";
        tr.appendChild(adrClientCell);

        const num_debut = document.createElement("td");
        num_debut.classList.add("th-st");
        num_debut.textContent = row.NUMERO_DEBUT_CHEQUE || "N/A";
        tr.appendChild(num_debut);

        const num_fin = document.createElement("td");
        num_fin.classList.add("th-st");
        num_fin.textContent = row.NUMERO_FIN_CHEQUE || "N/A";
        tr.appendChild(num_fin);

        const rib = document.createElement("td");
        rib.classList.add("th-st");
        rib.textContent = row.RIB || "N/A";
        tr.appendChild(rib);

        const cmc7 = document.createElement("td");
        cmc7.classList.add("th-st");
        cmc7.textContent = row.CMC7 || "N/A";
        tr.appendChild(cmc7);

        tableBody.appendChild(tr);
      });
    } else {
      return <div />;
    }
  }
  // filter  table
  function filterTable() {
    // Normalize search terms
    const searchTermName = name.toLowerCase();
    const searchTermAccount = account.toString().toLowerCase();
    const filterCodeTransaction = code.toLowerCase();
    const filterNombreFeuille = paper.toLowerCase();

    // Check if all search terms are empty
    const isSearchEmpty =
      searchTermName === "" &&
      filterCodeTransaction === "-" &&
      searchTermAccount === "" &&
      filterNombreFeuille === "-";

    // If all search terms are empty, reset the table to show all data
    if (isSearchEmpty) {
      generateTable(fileData);
      setFilteredData(fileData);
      return;
    }

    // Filter the data based on search terms
    const filteredData = fileData.filter((item: any) => {
      const nameMatch = item.NOM_CLIENT.toLowerCase().includes(searchTermName);
      const accountMatch = item.NUMERO_COMPTE.toString()
        .toLowerCase()
        .includes(searchTermAccount);
      const codeTransactionMatch =
        !filterCodeTransaction ||
        item.CODE_TRANSACTION.toLowerCase().includes(filterCodeTransaction);
      const nombreFeuilleMatch =
        !filterNombreFeuille ||
        item.NOMBRE_FEULLE.toString()
          .toLowerCase()
          .includes(filterNombreFeuille);

      return (
        nameMatch && accountMatch && codeTransactionMatch && nombreFeuilleMatch
      );
    });

    // Generate the table with filtered data and update the state
    generateTable(filteredData);
    setFilteredData(filteredData);
  }
  useEffect(() => {
    generateTable(fileData);
  });
  useEffect(() => {
    filterTable();
  }, [account, name, code, paper]);

  return (
    <div className="step-content" data-step="2">
      <h1>{t("print.stepTwoTitle")}</h1>
      <div className="file-import-container">
        <Dropdown
          data={["-", "CMC7", "E13B"].map((r) => ({
            title: r.toString(),
            value: r.toString(),
          }))}
          setValue={setFormat}
          value={format}
          className="!w-52"
        />
        <button
          id="select-file-button"
          className="btn-select-file"
          disabled={!format}
          onClick={handleFileUpload}
        >
          {t("print.stepTwoBtn")}
        </button>
        <input
          type="file"
          id="file-input"
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          id="delete-file-button"
          className="deleteBtn"
          style={{ display: "none" }}
        >
          {t("button.delete")}
        </button>
      </div>
      <div
        style={{ overflowX: "scroll", maxWidth: "1350px", minHeight: "300px" }}
      >
        <div
          className="filter-container"
          id="filter-container"
          style={{ display: "none" }}
        >
          <div className="child-filter">
            <label htmlFor="search-account">{t("settings.name")}</label>
            <input
              type="text"
              id="search-name"
              className="filter-input"
              placeholder="nom"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>
          <div className="child-filter">
            <label htmlFor="search-account">
              {t("tableFile.NUMERO_COMPTE")}
            </label>
            <input
              type="text"
              id="search-account"
              className="filter-input"
              placeholder="n° compte"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
              }}
            />
          </div>
          <div className="child-filter">
            <label htmlFor="filter-code-transaction">
              {t("print.codeTransaction")}
            </label>
            <Dropdown
              data={["-", "01", "02", "03"].map((r) => ({
                title: r.toString(),
                value: r.toString(),
              }))}
              setValue={setCode}
              value={code}
            />
          </div>

          <div className="child-filter">
            <label htmlFor="filter-nombre-feuille">
              {t("print.paperPerCheck")}
            </label>
            <Dropdown
              data={["-", "25", "50", "100"].map((r) => ({
                title: r.toString(),
                value: r.toString(),
              }))}
              setValue={setPaper}
              value={paper}
            />
          </div>

          <button id="clear-filters" className="clear-btn !w-40">
            {t("button.clear")}
          </button>
        </div>
        <table
          id="data-table"
          style={{
            display: "none",
           
            minHeight: "300px",
          }}
        >
          <thead>
            <tr className="th-st">
              <th className="th-st">{t("tableFile.NUMERO_COMPTE")}</th>
              <th className="th-st">{t("tableFile.NOM_CLIENT")}</th>
              <th className="th-st">{t("tableFile.NOMBRE_CARNET")}</th>
              <th className="th-st">{t("tableFile.NOMBRE_FEULLE")}</th>
              <th className="th-st">{t("tableFile.CODE_TRANSACTION")}</th>
              <th className="th-st">{t("tableFile.CODE_BANQUE")}</th>
              <th className="th-st">{t("tableFile.CODE_AGENCE")}</th>
              <th className="th-st">{t("tableFile.CODE_PAYS")}</th>
              <th className="th-st">{t("tableFile.ADR_CLIENT")}</th>
              <th className="th-st">{t("tableFile.NUMERO_DEBUT_CHEQUE")}</th>
              <th className="th-st">{t("tableFile.NUMERO_FIN_CHEQUE")}</th>
              <th className="th-st">{t("tableFile.RIB")}</th>
              <th className="th-st">{t("tableFile.CMC7")}</th>
            </tr>
          </thead>
          <tbody>{/* Data will be inserted here */}</tbody>
        </table>
      </div>
    </div>
  );
};

export default StepTwo;
