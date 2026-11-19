import "./LevelOverview.css";

const LevelOverview = () => (
  <article className="summary-card level-card">
    <div className="card-topline"><span className="summary-icon level-icon" aria-hidden="true">★</span><span className="eyebrow">目前等級</span></div>
    <p className="level-number">Lv. 03</p>
    <div className="level-progress-copy"><span>升級進度</span><strong>76%</strong></div>
    <div className="progress-track" role="progressbar" aria-label="升級進度 76%" aria-valuenow="76" aria-valuemin="0" aria-valuemax="100"><span className="progress-level" /></div>
    <p className="level-footnote">還差 <strong>120 XP</strong> 升級</p>
  </article>
);

export default LevelOverview;
