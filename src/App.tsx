// src/App.tsx
import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Impression from "./pages/impression";
import Templates from "./pages/templates";
import Settings from "./pages/paramete";
import History from "./pages/historique";
import ProtectedRoute from "./components/layout/ProtectedRoute";
const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem("auth");

  return (
    <Router  basename="/">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              redirectPath="/"
            />
          }
        >
          <Route path="/print" element={<Impression />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
