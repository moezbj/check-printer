import React from "react";
import "../style/pages/config.css";
import BanksSection from "./SettingSections/BanksSection";
import AgenciesSection from "./SettingSections/AgenciesSection";

export interface Bank {
  id: string;
  name: string;
  country_name: string;
}

export interface Agency {
  id: string;
  name: string;
  bank: string;
}

const SettingsPage: React.FC = () => {

  return (
    <div>
      <BanksSection />
      <AgenciesSection />
    </div>
  );
};

export default SettingsPage;
