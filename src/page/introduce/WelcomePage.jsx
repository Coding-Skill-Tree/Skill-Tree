import SiteHeader from "./components/SiteHeader.jsx";
import HeroBanner from "./components/HeroBanner.jsx";
import FeatureSection from "./components/FeatureSection.jsx";
import LevelPreview from "./components/LevelPreview.jsx";
import RewardSection from "./components/RewardSection.jsx";
import ComingSoon from "./components/ComingSoon.jsx";

// 歡迎頁面：頁首、Banner、網站介紹、關卡示意、獎勵機制、敬請期待，依序由上到下。
function WelcomePage() {
  return (
    <div className="welcome-page">
      <SiteHeader />
      <main className="welcome-main">
        <HeroBanner />
        <FeatureSection />
        <LevelPreview />
        <RewardSection />
        <ComingSoon />
      </main>
    </div>
  );
}

export default WelcomePage;
