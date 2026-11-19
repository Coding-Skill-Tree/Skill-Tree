import "./SkillProgress.css";

const SkillProgress = () => (
  <article className="panel-card skill-panel">
    <header className="panel-heading"><div><p className="eyebrow">YOUR LEARNING PATH</p><h2>技能學習進度</h2></div><span className="completion-rate">33<small>%</small></span></header>
    <p className="panel-description">持續累積，讓每一步都成為你的技能。</p>
    <div className="skill-stats">
      <div><span className="stat-symbol completed-symbol" aria-hidden="true">✓</span><strong>8</strong><span>已完成</span></div>
      <div><span className="stat-symbol progress-symbol" aria-hidden="true">↗</span><strong>3</strong><span>學習中</span></div>
      <div><span className="stat-symbol locked-symbol" aria-hidden="true">⌑</span><strong>13</strong><span>尚未開始</span></div>
    </div>
    <div className="category-list">
      <div className="category-row"><div className="category-label"><strong>網頁基礎</strong><span>3 / 3</span></div><div className="progress-track" role="progressbar" aria-label="網頁基礎完成 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"><span className="progress-web" /></div></div>
      <div className="category-row"><div className="category-label"><strong>樣式與版面</strong><span>5 / 8</span></div><div className="progress-track" role="progressbar" aria-label="樣式與版面完成 63%" aria-valuenow="63" aria-valuemin="0" aria-valuemax="100"><span className="progress-style" /></div></div>
      <div className="category-row"><div className="category-label"><strong>JavaScript</strong><span>0 / 7</span></div><div className="progress-track" role="progressbar" aria-label="JavaScript完成 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><span className="progress-js" /></div></div>
      <div className="category-row"><div className="category-label"><strong>框架與應用</strong><span>0 / 6</span></div><div className="progress-track" role="progressbar" aria-label="框架與應用完成 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><span className="progress-react" /></div></div>
    </div>
  </article>
);

export default SkillProgress;
