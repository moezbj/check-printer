/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TemplatePreviewAccusedProps {
  section: "check" | "accused" | "statement" | "rib";
  image: string;
  setImage: (d: string) => void;
  fields: string;
  setFields: (d: string) => void;
}

const TemplatePreview: React.FC<TemplatePreviewAccusedProps> = ({
  section,
  image,
  fields,
  setFields,
  setImage,
}) => {
  const { t } = useTranslation();

  const [backgroundImage, setBackgroundImage] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [NOM_CLIENTX, setNOM_CLIENTX] = useState<string>("");
  const [NOM_CLIENTY, setNOM_CLIENTY] = useState<string>("");
  const [CODE_AGENCEX, setCODE_AGENCEX] = useState<string>("");
  const [CODE_AGENCEY, setCODE_AGENCEY] = useState<string>("");
  const [CODE_BANQUEX, setCODE_BANQUEX] = useState<string>("");
  const [CODE_BANQUEY, setCODE_BANQUEY] = useState<string>("");
  const [NUMERO_COMPTEX, setNUMERO_COMPTEX] = useState<string>("");
  const [NUMERO_COMPTEY, setNUMERO_COMPTEY] = useState<string>("");
  const [RIBX, setRIBX] = useState<string>("");
  const [RIBY, setRIBY] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (fields) {
      const formatted = JSON.parse(fields);
      formatted.map((e: any) => {
        if (e.nom === "NOM_CLIENT") {
          setNOM_CLIENTX(e.x);
          setNOM_CLIENTY(e.y);
        }
        if (e.nom === "NUMERO_COMPTE") {
          setNUMERO_COMPTEX(e.x);
          setNUMERO_COMPTEY(e.y);
        }
        if (e.nom === "CODE_AGENCE") {
          setCODE_AGENCEX(e.x);
          setCODE_AGENCEY(e.y);
        }
        if (e.nom === "CODE_BANQUE") {
          setCODE_BANQUEX(e.x);
          setCODE_BANQUEY(e.y);
        }
        if (e.nom === "RIB") {
          setRIBX(e.x);
          setRIBY(e.y);
        }
      });
    }
    if (image) {
      setBackgroundImage(image);
    }
  }, [fields]);

  const submitAccused = () => {
    const accusedArray = [
      { nom: "NOM_CLIENT", x: NOM_CLIENTX, y: NOM_CLIENTY },
      {
        nom: "NUMERO_COMPTE",
        x: NUMERO_COMPTEX,
        y: NUMERO_COMPTEY,
      },
      { nom: "CODE_AGENCE", x: CODE_AGENCEX, y: CODE_AGENCEY },
      { nom: "CODE_BANQUE", x: CODE_BANQUEX, y: CODE_BANQUEY },
      { nom: "RIB", x: RIBX, y: RIBY },
    ];
    setFields(JSON.stringify(accusedArray));
    setImage(backgroundImage);
  };
  const toggle = () => setIsVisible(!isVisible);

  return (
    <div className="form-conatiner-group">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <input
          type="file"
          id={`upload-file-${section}-button`}
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <label
          htmlFor={`upload-file-${section}-button`}
          className="btn-add px-4 py-2"
        >
          {t("button.visualize")}
        </label>
        <div
          data-i18n="button.visualize"
          className="cursor-pointer rounded-md bg-orange-700 p-2"
          onClick={toggle}
        >
          {t("button.visualize")}
        </div>
      </div>
      <div className="check-container check-margin">
        {backgroundImage && (
          <img
            id="checkBackgroundAccused"
            className="check-background"
            src={backgroundImage}
          />
        )}
        {isVisible && (
          <div className="check-data">
            <div
              id="NOM_CLIENTAccused"
              className="data-field"
              style={{ top: `${NOM_CLIENTY}px`, left: `${NOM_CLIENTX}px` }}
            >
              nom
            </div>
            <div
              id="NUMERO_COMPTEAccused"
              className="data-field"
              style={{
                top: `${NUMERO_COMPTEY}px`,
                left: `${NUMERO_COMPTEX}px`,
              }}
            >
              3456774567
            </div>
            <div
              id="CODE_AGENCEAccused"
              className="data-field"
              style={{ top: `${CODE_AGENCEY}px`, left: `${CODE_AGENCEX}px` }}
            >
              OI9
            </div>
            <div
              id="CODE_BANQUEAccused"
              className="data-field"
              style={{ top: `${CODE_BANQUEY}px`, left: `${CODE_BANQUEX}px` }}
            >
              AB-1
            </div>
            <div
              id="RIBAccused"
              className="data-field"
              style={{ top: `${RIBY}px`, left: `${RIBX}px` }}
            >
              21
            </div>
          </div>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="NOM_CLIENTInput" data-i18n="tableFile.NOM_CLIENT">
          NOM_CLIENT
        </label>
        <input
          type="text"
          id="NOM_CLIENTInput"
          value="nom"
          onChange={() => {}}
        />
        <label htmlFor="NOM_CLIENTReceptionX">X </label>
        <input
          type="number"
          id="NOM_CLIENTReceptionX"
          value={NOM_CLIENTX}
          onChange={(e) => setNOM_CLIENTX(e.target.value)}
        />
        <label htmlFor="NOM_CLIENTReceptionY">Y </label>
        <input
          type="number"
          id="NOM_CLIENTReceptionY"
          value={NOM_CLIENTY}
          onChange={(e) => setNOM_CLIENTY(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="CODE_AGENCEInput" data-i18n="tableFile.CODE_AGENCE">
          CODE_AGENCE
        </label>
        <input
          type="text"
          id="CODE_AGENCEInput"
          value="OI9"
          onChange={() => {}}
        />
        <label htmlFor="CODE_AGENCEReceptionX">X </label>
        <input
          type="number"
          id="CODE_AGENCEReceptionX"
          value={CODE_AGENCEX}
          onChange={(e) => setCODE_AGENCEX(e.target.value)}
        />
        <label htmlFor="CODE_AGENCEReceptionY">Y </label>
        <input
          type="number"
          id="CODE_AGENCEReceptionY"
          value={CODE_AGENCEY}
          onChange={(e) => setCODE_AGENCEY(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="CODE_BANQUEInput" data-i18n="tableFile.CODE_BANQUE">
          CODE_BANQUE
        </label>
        <input
          type="text"
          id="CODE_BANQUEInput"
          value="AB-1"
          onChange={() => {}}
        />
        <label htmlFor="CODE_BANQUEReceptionX">X </label>
        <input
          type="number"
          id="CODE_BANQUEReceptionX"
          value={CODE_BANQUEX}
          onChange={(e) => setCODE_BANQUEX(e.target.value)}
        />
        <label htmlFor="CODE_BANQUEReceptionY">Y </label>
        <input
          type="number"
          id="CODE_BANQUEReceptionY"
          value={CODE_BANQUEY}
          onChange={(e) => setCODE_BANQUEY(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="NUMERO_COMPTEInput" data-i18n="tableFile.NUMERO_COMPTE">
          NUMERO_COMPTE
        </label>
        <input
          type="text"
          id="NUMERO_COMPTEInput"
          value="345677"
          onChange={() => {}}
        />
        <label htmlFor="NUMERO_COMPTEReceptionX">X </label>
        <input
          type="number"
          id="NUMERO_COMPTEReceptionX"
          value={NUMERO_COMPTEX}
          onChange={(e) => setNUMERO_COMPTEX(e.target.value)}
        />
        <label htmlFor="NUMERO_COMPTEReceptionY">Y </label>
        <input
          type="number"
          id="NUMERO_COMPTEReceptionY"
          value={NUMERO_COMPTEY}
          onChange={(e) => setNUMERO_COMPTEY(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="RIBInput">RIB</label>
        <input type="text" id="RIBInput" value="RB" onChange={() => {}} />
        <label htmlFor="RIBReceptionX">X </label>
        <input
          type="number"
          id="RIBReceptionX"
          value={RIBX}
          onChange={(e) => setRIBX(e.target.value)}
        />
        <label htmlFor="RIBReceptionY">Y </label>
        <input
          type="number"
          id="RIBReceptionY"
          value={RIBY}
          onChange={(e) => setRIBY(e.target.value)}
        />
      </div>
      <button
        onClick={submitAccused}
        className="cursor-pointer rounded-md bg-orange-700 p-2 text-white"
      >
        Valider
      </button>
    </div>
  );
};

export default TemplatePreview;
