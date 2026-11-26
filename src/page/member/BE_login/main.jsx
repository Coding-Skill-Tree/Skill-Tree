import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../BE_member/shared/admin-styles.js";
import "../forget_pwd/components/AuthCard/AuthCard.css";
import AdminLoginPage from "./AdminLoginPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminLoginPage />
  </StrictMode>,
);
