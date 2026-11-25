import Profile from "./page/member/profile/ProfilePage.jsx";
import SkillMap from "./page/practice/module-b-demo/src/App.jsx";
import Quizs from "./page/quiz/QuizResultPage.jsx";
import Dashboard from "./page/dashboard/Dashboard.jsx";
import AdminApp from "./page/admin/AdminApp.jsx";
import Home from "./page/home/Home.jsx";
import CharacterCreatePage from "./page/member/onboarding/CharacterCreatePage.jsx";
import ForgotPasswordPage from "./page/member/forget_pwd/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./page/member/reset_pwd/ResetPasswordPage.jsx";
import { Routes, Route } from "react-router";

function App() {
  // const path = window.location.pathname.replace(/\/+$/, "") || "/";

  return (
    <div>
      <Home />
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/onboarding" element={<CharacterCreatePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/skillmap" element={<SkillMap />} />
        <Route path="/quizs" element={<Quizs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </div>
  );
}

export default App;

// =============================================
/* {path === "/admin" || path.startsWith("/admin/") ? (
        <AdminApp />
      ) : (
        <div className="app-container">
          <Dashboard />
        </div>
      )} */
