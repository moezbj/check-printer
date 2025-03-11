import React, { useState, useEffect } from "react";
import { Bank } from "../paramete";
import Dropdown from "@/components/ui/dropdown";
import { useTranslation } from "react-i18next";

interface Agency {
  id: number;
  idagency: string;
  name: string;
  bank_name: string;
}

const AgenciesSection: React.FC = () => {
  const { t } = useTranslation();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [banksList, setBanksList] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<number[]>([]);

  useEffect(() => {
    // Simulate fetching banks data
    window.electronAPI.send("get-banks");
    window.electronAPI.receive("banks-loaded", (banks: Bank[]) => {
      setBanksList(banks);
    });
    // Simulate fetching banks data
    window.electronAPI.send("get-agencies");
    window.electronAPI.receive("agencies-loaded", (agencies: Agency[]) => {
      setAgencies(agencies);
    });
  }, []);
  console.log("agencies", agencies);
  const handleAddAgency = () => {
    if (id && name && bank) {
      const add = window.electronAPI.send("add-agency", {
        bankId: bank,
        name: name,
        idagency: id,
      });
      window.electronAPI.receive("agency-added", () => {
        window.electronAPI.send("get-agencies");
      });
      setId("");
      setName("");
      setBank("");
    }
  };

  const handleDeleteSelected = () => {
    console.log("selectedAgencies", selectedAgencies);
    window.electronAPI.send("delete-agencies", selectedAgencies);
    window.electronAPI.receive("agencies-deleted", () => {
      window.electronAPI.send("get-agencies");
      window.electronAPI.receive("agencies-loaded", (agencies: Agency[]) => {
        setAgencies(agencies);
        setSelectedAgencies([]);
      });
    });
  };
  const handelDeleteAgency = (id: string) => {
    window.electronAPI.send("delete-agency", id);
    window.electronAPI.receive("agency-deleted", () => {
      window.electronAPI.send("get-agencies");
      window.electronAPI.receive("agencies-loaded", (agencies: Agency[]) => {
        setAgencies(agencies);
      });
    });
  };

  return (
    <section id="agencies" className="section active">
      <h2>{t("settings.agencies")}</h2>
      <div className="flex items-center">
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter agency id"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter agency name"
        />
        <Dropdown
          data={banksList.map((r) => ({
            title: r.name.toString(),
            value: r.id.toString(),
          }))}
          setValue={setBank}
          value={
            bank
              ? banksList?.find((d) => d.id.toString() === bank.toString()).name
              : ""
          }
          className="mr-12 !w-72"
        />
        <button onClick={handleAddAgency} className="defaultBtn">
          {t("button.add")}
        </button>
        <button
          style={{
            display: selectedAgencies.length > 0 ? "inline-block" : "none",
          }}
          className="button-delete"
          onClick={handleDeleteSelected}
        >
          {t("button.delete")}{" "}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedAgencies.length > 0}
                onChange={(e) => {
                  setSelectedAgencies(
                    selectedAgencies.length === 0
                      ? agencies.map((agency) => agency.id)
                      : [],
                  );
                }}
              />
            </th>
            <th>ID</th>
            <th> {t("settings.name")}</th>
            <th> {t("settings.bank")}</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {agencies.map((agency) => (
            <tr key={agency.idagency}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedAgencies.includes(agency.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAgencies([...selectedAgencies, agency.id]);
                    } else {
                      setSelectedAgencies(
                        selectedAgencies.filter((id) => id !== agency.id),
                      );
                    }
                  }}
                />
              </td>
              <td>{agency.idagency}</td>
              <td>{agency.name}</td>
              <td>{agency.bank_name}</td>
              <td>
                <button
                  onClick={() => handelDeleteAgency(agency.idagency)}
                  className="button-delete"
                >
                  {t("button.delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default AgenciesSection;
