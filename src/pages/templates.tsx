import React, { useEffect, useState } from "react";
import TemplateList from "./TemplateSection/TemplateList";
import TemplateForm from "./TemplateSection/TemplateForm";
import "@/style/pages/templates.css";

export interface Template {
  id: number;
  name: string;
  image: string;
  imageStatement: string;
  imageReception: string;
  imageRib: string;
  fields: string;
  statement: string;
  accused: string;
  rib: string;
  bank_id: number;
  format: string;
}

export interface FieldPosition {
  nom: string;
  x: number;
  y: number;
}

export interface Bank {
  id: number;
  name: string;
}

export interface FormatOption {
  title: string;
  value: string;
}

const formatOptions: FormatOption[] = [
  { title: "-", value: "---" },
  { title: "Standard", value: "PF" },
  { title: "Large", value: "GF" },
];

const App: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );

  useEffect(() => {
    // Fetch templates and banks from the backend
    window.electronAPI.send("get-template");
    window.electronAPI.receive("templates-loaded", (templates: Template[]) => {
      setTemplates(templates);
    });

    window.electronAPI.send("get-banks");
    window.electronAPI.receive("banks-loaded", (banks: Bank[]) => {
      setBanks(banks);
    });
  }, []);

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setShowForm(true);
  };

  const handleEditTemplate = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSelectedTemplate(template);
      setShowForm(true);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    window.electronAPI.send("delete-templates", id);
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleSubmitTemplate = (template: Omit<Template, "id">) => {
    if (selectedTemplate) {
      // Update existing template
      window.electronAPI.send("update-template-byId", {
        id: selectedTemplate.id,
        updatedData: template,
      });
      window.electronAPI.receive("template-updated", () => {
        window.electronAPI.send("get-template");
        window.electronAPI.receive(
          "templates-loaded",
          (templates: Template[]) => {
            setTemplates(templates);
          },
        );
      });
    } else {
      // Add new template
      window.electronAPI.send("add-template", template);
      window.electronAPI.send("get-template");
      window.electronAPI.receive(
        "templates-loaded",
        (templates: Template[]) => {
          setTemplates(templates);
        },
      );
    }
    setShowForm(false);
  };

  return (
    <div>
      {!showForm ? (
        <TemplateList
          templates={templates}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onAddTemplate={handleAddTemplate}
        />
      ) : (
        <TemplateForm
          template={selectedTemplate || undefined}
          banks={banks}
          formatOptions={formatOptions}
          onSubmit={handleSubmitTemplate}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default App;
