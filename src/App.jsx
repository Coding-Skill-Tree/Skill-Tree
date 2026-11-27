import Profile from "./page/member/profile/ProfilePage.jsx";
import SkillMap from "./page/practice/module-b-demo/src/App.jsx";
import Quizs from "./page/quiz/QuizResultPage.jsx";
import Dashboard from "./page/dashboard/Dashboard.jsx";
import AdminApp from "./page/admin/AdminApp.jsx";
import Register from "./page/auth/RegisterPage.jsx"
import Login from "./page/auth/LoginPage.jsx";
import Home from "./page/home/Home.jsx";
import { Routes, Route } from "react-router";

function App() {
  // const path = window.location.pathname.replace(/\/+$/, "") || "/";

  return (
    <div>
      <Home />
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/skillmap" element={<SkillMap />} />
        <Route path="/quizs" element={<Quizs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
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
