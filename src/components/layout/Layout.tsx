// src/components/Layout.tsx
import React from "react";
import "../../style/layouts/layout.css"; // Optional: for styling
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Dropdown from "../ui/dropdown";
import logo from "../../../public/image/logo.png";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const location = useLocation()
  const logout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("file_id");
    localStorage.removeItem("steeper");
    localStorage.removeItem("languageSelect");
    nav("/");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="info-container">
          <div className="logo">
            <div className="logo-container">
              <img className="img-logo" src={logo} />
            </div>
            <h2>{t("sideBar.title")}</h2>
          </div>
          <ul className="menu">
            <li>
              <NavLink
                to="/print"
                className={({ isActive }) => (isActive ? "active-path" : "")}
              >
                {t("sideBar.print")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? "active-path" : "")}
              >
                {t("sideBar.Settings")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/templates"
                className={({ isActive }) => (isActive ? "active-path" : "")}
              >
                {t("sideBar.templates")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/history"
                className={({ isActive }) => (isActive ? "active-path" : "")}
              >
                {t("sideBar.history")}
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="mb-12 ml-4">
          <Dropdown
            className="mb-4 mt-4"
            data={[
              { title: t("sideBar.french"), value: "fr" },
              { title: t("sideBar.english"), value: "en" },
            ].map((r) => ({
              title: r.title,
              value: r.value,
            }))}
            setValue={i18n.changeLanguage}
            value={i18n.language}
          />
          <button className="deleteBtn max-w-48" onClick={logout}>
            {t("button.logout")}
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
};

export default Layout;
