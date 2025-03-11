import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/pages/login.css"; // Assuming you move the CSS to a separate file
import { useTranslation } from "react-i18next";
import logo from "../../public/image/logo.png";
import Dropdown from "../components/ui/dropdown";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disableBtn, setDisableBtn] = useState<boolean>(false);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setDisableBtn(true);
    // Basic validation
    if (!email || !password) {
      alert(t("login.empty"));
      setDisableBtn(false);

      return;
    }

    // Send the credentials to the main process using the exposed API
    window.electronAPI.send("authenticate-user", { email, password });

    // Listen for the authentication result
    window.electronAPI.receive("authentication-result", (result: any) => {
      if (result.success) {
        /* localStorage.setItem("auth", JSON.stringify(result));
        alert(`Login successful as ${result.user.role}!`);
        window.location.href =
          result.user.role === "admin" ? "index.html" : "index.html"; */
        localStorage.setItem("auth", JSON.stringify(result)); // Store a fake token
        setDisableBtn(false);

        navigate("/print"); // Redirect to a protected route
      } else {
        setDisableBtn(false);
        alert(
          result.message === "ERROR_CREDENTIALS"
            ? t("login.ERROR_CREDENTIALS")
            : "",
        );
      }
    });
  };

  return (
    <div className="container">
      <div className="absolute  right-6 top-6 w-24">
        <Dropdown
          className="mb-4 mt-4 !w-full"
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
      </div>
      <div className="login-container">
        <div>
          <img src={logo} alt="Logo" />
        </div>
        <div>
          <div className="input-group">
            <label htmlFor="email">{t("login.email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="example@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="customWidth"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">{t("login.password")}</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="*****"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="customWidth"
            />
          </div>
          <div className="btn" onClick={handleSubmit}>
            {t("button.login")}
          </div>
          {/*         <a href="#" className="forgot-password">
            Forgot Password?
          </a> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
