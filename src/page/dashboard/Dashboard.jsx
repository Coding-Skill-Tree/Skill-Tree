import DashboardHeader from "./components/DashboardHeader/DashboardHeader.jsx";
import DashboardSidebar from "./components/DashboardSidebar/DashboardSidebar.jsx";
import ProfileInfo from "./components/ProfileInfo/ProfileInfo.jsx";
import XpOverview from "./components/XpOverview/XpOverview.jsx";
import LevelOverview from "./components/LevelOverview/LevelOverview.jsx";
import SkillProgress from "./components/SkillProgress/SkillProgress.jsx";
import RecentActivity from "./components/RecentActivity/RecentActivity.jsx";
import AchievementList from "./components/AchievementList/AchievementList.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <DashboardSidebar />
      <div className="dashboard-layout">
        <DashboardHeader />
        <main className="dashboard-main">
          <section className="dashboard-profile" aria-label="個人資訊"><ProfileInfo /></section>
          <section className="dashboard-xp" aria-label="經驗值"><XpOverview /></section>
          <section className="dashboard-level" aria-label="等級進度"><LevelOverview /></section>
          <section className="dashboard-skill-progress" aria-label="技能學習進度"><SkillProgress /></section>
          <section className="dashboard-recent-activity" aria-label="近期學習紀錄"><RecentActivity /></section>
          <section className="dashboard-achievement-list" aria-label="已取得成就"><AchievementList /></section>
        </main>
      </div>
    </div>
  );
}
