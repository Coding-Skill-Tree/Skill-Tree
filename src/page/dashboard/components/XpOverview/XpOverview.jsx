import "./XpOverview.css";
import { mockUsers, xpRecords } from "../../data/mockData.js";

const XpOverview = () => {
  // 取得目前使用者的累積 XP
  // 1. 從 mockUsers 找到 alice
  const currentId = "alice";
  const user = mockUsers[currentId];
  // 2. 找到 alice 後，取得她的 totalXp
  // 3. 如果找不到使用者，顯示 0
  const totalXp = user ? user.totalXp : 0;

  // 篩選目前使用者的 XP 紀錄
  const filterXpRecords = xpRecords.filter(
    (record) => record.userId === currentId,
  );

  // 計算近期獲得的 XP
  const recentXp = filterXpRecords.reduce((sum, record) => sum + record.xp, 0);

  return (
    <article className="summary-card xp-card">
      <div className="card-topline">
        <span className="summary-icon xp-icon" aria-hidden="true">
          ✦
        </span>
        <span className="eyebrow">累積經驗值</span>
      </div>
      <p className="summary-number">
        {totalXp}
        <span>XP</span>
      </p>
      <div className="xp-recent">
        <span aria-hidden="true">↗</span>
        <strong>+{recentXp} XP</strong>
        <span>近期獲得</span>
      </div>
    </article>
  );
};

export default XpOverview;
