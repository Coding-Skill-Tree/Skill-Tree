import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 共用樣式：順序要先 reset，再變數，再 App.css、共用按鈕，最後才是本頁自己的樣式
import "../../../style/reset.css";
import "../../../style/variables.css";
import "../../../App.css";
import "../../../style/button.css";
import "./index.css";
import WelcomePage from "./WelcomePage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WelcomePage />
  </StrictMode>,
);
