import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 共用樣式：順序要先 reset，再變數，再 App.css、共用按鈕，最後才是本頁自己的樣式
import "../../style/reset.css";
import "../../style/variables.css";
import "../../App.css";
import "../../style/button.css";
import "./profile-base.css";
import ProfilePage from "./ProfilePage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ProfilePage />
  </StrictMode>,
);
