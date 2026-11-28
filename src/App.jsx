import { Route, Routes, useLocation } from "react-router";
import Profile from "./page/member/profile/ProfilePage.jsx";
import SkillMap from "./page/skill-map/SkillMapPage.jsx";
import Quizs from "./page/quiz/QuizResultPage.jsx";
import Dashboard from "./page/dashboard/Dashboard.jsx";
import AdminApp from "./page/admin/AdminApp.jsx";
import Home from "./page/home/Home.jsx";
import DemoPage from "./page/demo/DemoPage.jsx";
import CharacterCreatePage from "./page/member/onboarding/CharacterCreatePage.jsx";
import MemberLoginPage from "./page/member/login/LoginPage.jsx";
import MemberRegisterPage from "./page/member/register/RegisterPage.jsx";
import ForgotPasswordPage from "./page/member/forget_pwd/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./page/member/reset_pwd/ResetPasswordPage.jsx";
import AcceptanceLab from "./page/acceptance/AcceptanceLab.jsx";
import DevWorkbench from "./page/dev-workbench/DevWorkbench.jsx";

function App() {
  const { pathname } = useLocation();
  const isDeveloperPage = import.meta.env.DEV
    && (pathname.startsWith("/acceptance") || pathname === "/workbench");
  const isAccountPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
  ].includes(pathname);

  return (
    <div>
      {!isDeveloperPage && !isAccountPage && <Home demo={pathname === "/demo"} />}
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<MemberLoginPage />} />
        <Route path="/register" element={<MemberRegisterPage />} />
        <Route path="/onboarding" element={<CharacterCreatePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/skillmap" element={<SkillMap />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/quizs" element={<Quizs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/*" element={<AdminApp />} />
        {import.meta.env.DEV && <Route path="/acceptance" element={<AcceptanceLab />} />}
        {import.meta.env.DEV && <Route path="/workbench" element={<DevWorkbench />} />}
      </Routes>
    </div>
  );
}

export default App;
