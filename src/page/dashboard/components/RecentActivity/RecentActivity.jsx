import "./RecentActivity.css";

const RecentActivity = () => (
  <article className="panel-card activity-panel"><header className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>近期學習紀錄</h2></div><span className="text-link">本週</span></header>
    <ol className="activity-list">
      <li><span className="activity-marker" aria-hidden="true" /><div className="activity-copy"><strong>完成 CSS Grid 版面練習</strong><span>技能練習・今天 10:42</span></div><span className="activity-xp">+25 XP</span></li>
      <li><span className="activity-marker" aria-hidden="true" /><div className="activity-copy"><strong>複習 Flexbox 對齊方式</strong><span>學習紀錄・昨天 19:15</span></div><span className="activity-xp">+20 XP</span></li>
      <li><span className="activity-marker" aria-hidden="true" /><div className="activity-copy"><strong>完成 HTML 表單挑戰</strong><span>技能挑戰・11 月 17 日</span></div><span className="activity-xp">+30 XP</span></li>
    </ol>
  </article>
);

export default RecentActivity;
