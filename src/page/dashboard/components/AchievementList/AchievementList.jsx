import "./AchievementList.css";

const AchievementList = () => (
  <article className="panel-card achievement-panel"><header className="panel-heading"><div><p className="eyebrow">MILESTONES</p><h2>已取得成就</h2></div><span className="achievement-count">✦ 3 項</span></header>
    <div className="achievement-grid">
      <div className="achievement-card"><span className="achievement-icon" aria-hidden="true">✦</span><div><strong>踏出第一步</strong><p>完成第一項技能學習</p><small>已取得・11 月 12 日</small></div></div>
      <div className="achievement-card"><span className="achievement-icon" aria-hidden="true">↗</span><div><strong>穩定前進</strong><p>累積完成 5 項技能</p><small>已取得・11 月 16 日</small></div></div>
      <div className="achievement-card"><span className="achievement-icon" aria-hidden="true">⌁</span><div><strong>持續練習</strong><p>一週內完成 3 次學習</p><small>已取得・11 月 18 日</small></div></div>
    </div>
  </article>
);

export default AchievementList;
