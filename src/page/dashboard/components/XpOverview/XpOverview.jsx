import "./XpOverview.css";

const XpOverview = () => (
  <article className="summary-card xp-card">
    <div className="card-topline">
      <span className="summary-icon xp-icon" aria-hidden="true">
        ✦
      </span>
      <span className="eyebrow">累積經驗值</span>
    </div>
    <p className="summary-number">
      1500 <span>XP</span>
    </p>
    <div className="xp-recent">
      <span aria-hidden="true">↗</span>
      <strong>+45 XP</strong>
      <span>近期獲得</span>
    </div>
  </article>
);

export default XpOverview;
