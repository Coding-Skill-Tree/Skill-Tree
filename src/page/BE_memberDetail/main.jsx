import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../BE_member/shared/admin-styles.js";
import MemberDetailPage from "./MemberDetailPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MemberDetailPage />
  </StrictMode>,
);
