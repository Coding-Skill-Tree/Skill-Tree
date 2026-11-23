import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 共用樣式（reset → 變數 → App.css → 按鈕 → 會員頁補充樣式），和忘記密碼頁相同
import "../forget_pwd/shared-styles.js";
import ResetPasswordPage from "./ResetPasswordPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ResetPasswordPage />
  </StrictMode>,
);
