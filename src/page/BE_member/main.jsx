import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared/admin-styles.js";
import MemberListPage from "./MemberListPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MemberListPage />
  </StrictMode>,
);
