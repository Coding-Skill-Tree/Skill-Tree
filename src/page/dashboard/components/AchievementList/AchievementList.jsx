import "./AchievementList.css";
import { NavArrowUp, NavArrowDown } from "iconoir-react";
import { useRef, useState } from "react";

const AchievementList = () => {
  const achievementData = [
    {
      id: 1,
      achievementIcon: "✦",
      item: "踏出第一步",
      description: "完成第一項技能學習",
      status: "已取得",
      date: "11 月 12 日",
    },
    {
      id: 2,
      achievementIcon: "↗",
      item: "穩定前進",
      description: "累積完成 5 項技能",
      status: "已取得",
      date: "11 月 16 日",
    },
    {
      id: 3,
      achievementIcon: "⌁",
      item: "持續練習",
      description: "一週內完成 3 次學習",
      status: "已取得",
      date: "11 月 18 日",
    },
    {
      id: 4,
      achievementIcon: "✦",
      item: "切版高手",
      description: "已完成HTML、CSS課程",
      status: "未取得",
      date: "",
    },
    {
      id: 5,
      achievementIcon: "✦",
      item: "切版專家",
      description: "已完成HTML、CSS課程",
      status: "未取得",
      date: "",
    },
    {
      id: 6,
      achievementIcon: "✦",
      item: "JS高手",
      description: "已完成JS課程",
      status: "未取得",
      date: "",
    },
    {
      id: 7,
      achievementIcon: "✦",
      item: "成為AI的飼主",
      description: "已完成AI agent課程",
      status: "未取得",
      date: "",
    },
  ];

  const achievementRef = useRef(null);
  const [achItemsShown, setAchItemsShown] = useState(true);

  // 監視滾輪是否到底的狀態
  const [isAtBottom, setIsAtBottom] = useState(false);
  const handleScroll = (e) => {
    const element = e.currentTarget;
    const atBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    setIsAtBottom(atBottom);
  };

  return (
    <article className="panel-card achievement-panel">
      <header className="panel-heading">
        <div>
          <h2>已取得成就</h2>
        </div>
        <span className="achievement-count">✦ 3 項</span>
      </header>
      <div
        className={`achievement-wrapper ${isAtBottom ? "at-bottom" : ""}`}
        onScroll={handleScroll}
      >
        <div className="achievement-grid" ref={achievementRef}>
          {achItemsShown ? (
            achievementData.map((i) => (
              <div className="achievement-card" key={i.id}>
                <span className="achievement-icon" aria-hidden="true">
                  {i.achievementIcon}
                </span>
                <div>
                  <strong>{i.item}</strong>
                  <p>{i.description}</p>
                  <small>
                    {i.status}・{i.date}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-achievement">目前沒有任何成就</div>
          )}
        </div>
      </div>
      <div className="panel-bottom achievement-list">
        <a href="#" className="watch-all-progress">
          查看所有成就
        </a>
      </div>
    </article>
  );
};

export default AchievementList;
