// src/components/TemplateList.tsx
import React, { useState } from "react";
import { Template } from "../templates";
import { useTranslation } from "react-i18next";
import "@/style/pages/templates.css";

interface TemplateListProps {
  templates: Template[];
  onEditTemplate: (id: number) => void;
  onDeleteTemplate: (id: number) => void;
  onAddTemplate: () => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  onEditTemplate,
  onDeleteTemplate,
  onAddTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section id="list" className="section active">
      <h2 data-i18n="">{t("templates.title")}</h2>
      <button
        onClick={onAddTemplate}
        id="btn-add"
        className="mr-4"
        data-i18n="button.add"
      >
        {t("button.add")}
      </button>
      <input
        type="text"
        id="search-name"
        className="filter-input"
        placeholder="recherche"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <table id="templateTable" style={{ display: "table" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th data-i18n="">{t("settings.name")}</th>
            <th>Images</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTemplates.map((template) => (
            <tr key={template.id}>
              <td>{template.id}</td>
              <td>{template.name}</td>
              <td>
                <img
                  width="220px"
                  height="100px"
                  src={template.image}
                  alt={template.name}
                />
              </td>
              <td className="flex flex-col">
                <button
                  className="defaultBtn"
                  onClick={() => onEditTemplate(template.id)}
                >
                  {t("button.edit")}
                </button>
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  id="deleteBtn"
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

export default TemplateList;
