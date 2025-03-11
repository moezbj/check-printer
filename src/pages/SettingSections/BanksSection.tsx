import { countriesList } from "@/lib/lists";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Bank {
  id: string;
  name: string;
  country_name: string;
}

const BanksSection: React.FC = () => {
  const { t } = useTranslation();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  useEffect(() => {
    // Simulate fetching countries data
    window.electronAPI.send("get-banks");
    window.electronAPI.receive("banks-loaded", (banks: Bank[]) =>
      setBanks(banks),
    );
  }, []);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim().toLowerCase();
    setCountry(query);

    if (!query) {
      setShowSuggestions(false);
      setFilteredCountries([]);
      return;
    }

    const filtered = countriesList.filter((country) =>
      country.name.toLowerCase().includes(query),
    );
    setFilteredCountries(filtered);
    setShowSuggestions(true);
  };
  const handleSuggestionClick = (countryName: string) => {
    setCountry(countryName);
    setShowSuggestions(false);
  };

  const handleAddBank = () => {
    if (id && name && country) {
      const newBank: Bank = { id, name, country_name: country };
      window.electronAPI.send("add-bank", {
        name: newBank.name,
        country: newBank.country_name,
        idbank: newBank.id,
      });
      window.electronAPI.receive("bank-added", () => {
        window.electronAPI.send("get-banks");
      });

      setId("");
      setName("");
      setCountry("");
    }
  };

  const handleDeleteSelected = () => {
    window.electronAPI.send("delete-banks", selectedBanks);
    window.electronAPI.receive("banks-deleted", () => {
      window.electronAPI.send("get-banks");
    });
  };
  const handelDeleteBank = (id: string) => {
    window.electronAPI.send("delete-bank", id);
    window.electronAPI.receive("bank-deleted", () => {
      window.electronAPI.send("get-banks");
    });
  };
  return (
    <section id="banks" className="section active">
      <h2>{t("settings.banks")}</h2>
      <div className="headers">
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter bank id"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter bank name"
        />
        <div className="autocomplete-container">
          <input
            type="text"
            value={country}
            onChange={handleInputChange}
            placeholder="Enter or select a country"
          />
          {showSuggestions && (
            <ul className="autocomplete-list">
              {filteredCountries.map((country) => (
                <li
                  key={country.id}
                  onClick={() => handleSuggestionClick(country.name)}
                >
                  {country.flagEmoji} {country.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={handleAddBank} className="defaultBtn">
          {t("button.add")}
        </button>
        <button
          style={{
            display: selectedBanks.length > 0 ? "inline-block" : "none",
          }}
          className="button-delete"
          onClick={handleDeleteSelected}
        >
          {t("button.delete")}
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setSelectedBanks(
                    isChecked ? banks.map((bank) => bank.id) : [],
                  );
                }}
              />
            </th>
            <th>ID</th>
            <th> {t("settings.name")}</th>
            <th> {t("settings.country")}</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((bank) => (
            <tr key={bank.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedBanks.includes(bank.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBanks([...selectedBanks, bank.id]);
                    } else {
                      setSelectedBanks(
                        selectedBanks.filter((id) => id !== bank.id),
                      );
                    }
                  }}
                />
              </td>
              <td>{bank.id}</td>
              <td>{bank.name}</td>
              <td>{bank.country_name}</td>
              <td>
                <button
                  onClick={() => handelDeleteBank(bank.id)}
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

export default BanksSection;
