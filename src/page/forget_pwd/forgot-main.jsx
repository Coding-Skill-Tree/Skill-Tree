import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared-styles.js";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ForgotPasswordPage />
  </StrictMode>,
);
