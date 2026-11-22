import { useState } from "react";
import "./RecentActivity.css";

const RecentActivity = () => {
  // 假資料：學習紀錄
  const learningData = [
    {
      id: 1,
      content: "完成 CSS Grid 版面練習",
      category: "CSS",
      date: "今天 10:42",
      xp: `+${25} XP`,
    },
    {
      id: 2,
      content: "複習 Flexbox 對齊方式",
      category: "CSS",
      date: "昨天 19:15",
      xp: `+${20} XP`,
    },
    {
      id: 1,
      content: "完成 HTML 表單挑戰",
      category: "HTML",
      date: "11 月 17 日",
      xp: `+${30} XP`,
    },
  ];

  // 有紀錄／空紀錄控制設定
  const [haveRecords, setHaveRecords] = useState(true);

  return (
    <article className="panel-card activity-panel">
      <div>
        <header className="panel-heading">
          <div>
            <h2>近期學習紀錄</h2>
          </div>
          <span className="text-link">本週</span>
        </header>
        <ol className="activity-list">
          {haveRecords ? (
            learningData.map(({ id, content, category, date, xp }) => (
              <li key={id}>
                <span className="activity-marker" aria-hidden="true" />
                <div className="activity-item">
                  <strong>{content}</strong>
                  <span>
                    {category}・{date}
                  </span>
                </div>
                <span className="activity-xp">{xp}</span>
              </li>
            ))
          ) : (
            <div className="empty-activity">
              <span>沒有任何學習紀錄</span>
            </div>
          )}
        </ol>
      </div>
      <a
        href="#"
        className="watch-all-activity"
        onClick={() => setHaveRecords(!haveRecords)}
      >
        → 查看全部
      </a>
    </article>
  );
};

export default RecentActivity;
