import { useState } from "react";
import "./LevelOverview.css";

const LevelOverview = () => {
  // 確認視窗是否隱藏
  const [isVisible, setIsVisible] = useState(true);
  // 關閉通知設定
  const [isClosing, setIsClosing] = useState(false);

  return (
    <article className="summary-card level-card">
      <div className="card-topline">
        <span className="eyebrow">目前等級</span>
      </div>
      <p className="level-number">Lv. 04</p>
      <div className="level-progress-copy">
        <span>升級進度</span>
        <strong>0%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="升級進度 0%"
        aria-valuenow="0"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span className="progress-level" />
      </div>
      <p className="level-footnote">
        還差 <strong>500 XP</strong> 升級
      </p>

      {isVisible && (
        <div
          className="level-up-notification-bg"
          onAnimationEnd={() => {
            if (isClosing) {
              setIsVisible(false);
            }
          }}
        >
          <div
            className={`level-up-notification ${isClosing ? "closing" : ""}`}
          >
            <span className="level-up">Level up !</span>
            <span>
              恭喜你升等為<strong>Lv. 04</strong>
            </span>
            <button
              className="level-up-closed-btn"
              onClick={() => setIsClosing(true)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default LevelOverview;
