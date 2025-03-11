// src/components/StepOne.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import single from "../../../public/image/printer.png";
import multi from "../../../public/image/multibac.png";
interface Props {
  setCurrentStep: (h: number) => void;
}

const StepOne: React.FC<Props> = ({ setCurrentStep }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="step-content" data-step="1">
      <h1>{t("print.stepOneTitle")}</h1>

      <div className="print-type mb-40">
        <div className="child-print-type" onClick={() => setCurrentStep(2)}>
          <h3 data-i18n="print.printTypeSimple">
            {t("print.printTypeSimple")}
          </h3>
          <div className="child-print-img">
            <img src={single} alt="Printer" />
          </div>
          <p data-i18n="print.printTypeSimpleDesc">
            {t("print.printTypeSimpleDesc")}
          </p>
        </div>
        <div className="child-print-type">
          <div className="disable-background"></div>
          <h3 data-i18n="print.printTypeMultiple">
            {t("print.printTypeMultiple")}
          </h3>
          <div className="child-print-img">
            <img src={multi} alt="Multibac" />
          </div>
          <p data-i18n="print.printTypeMultipleDesc">
            {t("print.printTypeMultipleDesc")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepOne;
