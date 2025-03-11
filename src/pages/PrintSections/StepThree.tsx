// src/components/StepThree.tsx
import React, { useEffect, useState } from "react";
import "@/style/pages/print.css";
import { Template } from "../templates";
import { useTranslation } from "react-i18next";
import Dropdown from "@/components/ui/dropdown";

interface StepProps {
  setTemplate: (d: Template) => void;
  template: Template;
}

const StepThree = ({ setTemplate, template }: StepProps) => {
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<Template[]>([]);
  useEffect(() => {
    window.electronAPI.send("get-template");
    window.electronAPI.receive("templates-loaded", (templates: Template[]) => {
      setTemplates(templates);
    });
  }, []);

  return (
    <div className="step-content" data-step="3">
      <h1>{t("print.stepThreeTitle")}</h1>
      <Dropdown
        data={templates.map((r) => ({ title: r.name, value: r }))}
        setValue={setTemplate}
        value={template}
        title="template"
      />

      <div className="check-container">
        {template && (
          <img
            id="checkBackground"
            className="check-background"
            style={{ border: "1px solid dashed", marginTop: 20 }}
            src={template?.image}
            alt="Check Background"
          />
        )}
      </div>
    </div>
  );
};

export default StepThree;
