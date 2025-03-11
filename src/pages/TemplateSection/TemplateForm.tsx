// src/components/TemplateForm.tsx
import React, { useState, useEffect } from "react";
import { Bank, FormatOption, Template } from "../templates";
import Accordion from "@/components/ui/Accordion";
import TemplatePreview from "./TemplatePreview";
import TemplatePreviewAccused from "./TemplatePreviewAccused";
import TemplatePreviewStatement from "./TemplatePreviewStatement";
import TemplatePreviewRib from "./TemplatePreviewRib";
import { useTranslation } from "react-i18next";

import "@/style/pages/templates.css";

interface TemplateFormProps {
  template?: Template;
  banks: Bank[];
  formatOptions: FormatOption[];
  onSubmit: (template: Omit<Template, "id">) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  banks,
  formatOptions,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState(template?.name || "");
  const [format, setFormat] = useState(template?.format || "");
  const [bankId, setBankId] = useState(template?.bank_id || "");
  const [image, setImage] = useState(template?.image || "");
  const [imageStatement, setImageStatement] = useState(
    template?.imageStatement || "",
  );
  const [imageReception, setImageReception] = useState(
    template?.imageReception || "",
  );
  const [imageRib, setImageRib] = useState(template?.imageRib || "");

  const [fields, setFields] = useState<string>(template ? template.fields : "");
  const [statement, setStatement] = useState<string>(
    template ? template.statement : "",
  );

  const [accused, setAccused] = useState<string>(
    template ? template.accused : "",
  );

  const [rib, setRib] = useState<string>(template ? template.rib : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert(t("errors.templateName"));
      return;
    }
    if (!format) {
      alert(t("errors.templateFormat"));
      return;
    }
    if (!bankId) {
      alert(t("errors.templateBank"));
      return;
    }
    onSubmit({
      name,
      image,
      imageStatement,
      imageReception,
      imageRib,
      fields,
      statement,
      accused,
      rib,
      bank_id: Number(bankId),
      format,
    });
  };

  return (
    <section id="create">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="nametemplate"
          placeholder="template"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          id="format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          {formatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.title}
            </option>
          ))}
        </select>
        <select
          id="agencyBank"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
        >
          <option value="">---</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>

        <div className="mt-4">
          <p>1* {t("templates.step1")}</p>
          <p>2* {t("templates.step2")} </p>
          <p className="mb-10">3* {t("templates.step3")} </p>

          <Accordion title={t("templates.subTitle1")}>
            <TemplatePreview
              section="check"
              image={image}
              setImage={setImage}
              fields={fields}
              setFields={setFields}
            />
          </Accordion>
          <Accordion title={t("templates.subTitle3")}>
            <TemplatePreviewStatement
              section="statement"
              image={imageStatement}
              setImage={setImageStatement}
              fields={statement}
              setFields={setStatement}
            />
          </Accordion>
          <Accordion title={t("templates.subTitle2")}>
            <TemplatePreviewAccused
              section="accused"
              image={imageReception}
              setImage={setImageReception}
              fields={accused}
              setFields={setAccused}
            />
          </Accordion>
          <Accordion title={t("templates.subTitle4")}>
            <TemplatePreviewRib
              section="rib"
              image={imageRib}
              setImage={setImageRib}
              fields={rib}
              setFields={setRib}
            />
          </Accordion>
        </div>
        {!template && (
          <>
            <button type="submit" className="btn-add max-w-48">
              Envoyer
            </button>
            <button
              type="button"
              onClick={onCancel}
              id="deleteBtn"
              className="ml-4"
            >
              Annuler
            </button>
          </>
        )}
      </form>
    </section>
  );
};

export default TemplateForm;
