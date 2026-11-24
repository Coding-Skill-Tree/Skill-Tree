import React from "react";
import Icon from "./Icon.jsx";
import { nodeById, statusText, xpFor } from "../lib/progress.js";
export default function TaskPanel({
  skill,
  node,
  status,
  onStart,
  onNext,
  hasNext,
  onShowHistory,
}) {
  const first = skill.units[0].nodes[0].id === node.id;
  const typeLabel = {
    lesson: "一般節點",
    "unit-challenge": "單元挑戰",
    "final-challenge": "最終挑戰",
  }[node.type];
  const done = status === "completed";
  const goals = first ? skill.introObjectives : [node.topic];

  return (
    <aside
      id="task-panel"
      className="task-panel"
      aria-labelledby="task-heading"
      data-selected-node={node.id}
    >
      <header className="task-header">
        <h2 id="task-heading">
          <Icon name="flag" />
          學習任務
        </h2>
        <p className="task-node-id">{node.id}</p>
      </header>
      <section className="task-content" aria-labelledby="task-title">
        <Icon name={skill.id} className="task-icon" />
        <h3 id="task-title">{node.title}</h3>
        <p className="task-description">
          {first ? skill.intro : `本節點的學習範圍：${node.topic}。`}
        </p>
        <ul className="task-tags">
          <li>{skill.name}</li>
          <li>{typeLabel}</li>
          <li>{statusText[status]}</li>
        </ul>
        <dl className="task-meta">
          <div>
            <dt>前置條件</dt>
            <dd>
              {node.prerequisite
                ? `${node.prerequisite} ${nodeById.get(node.prerequisite).title}`
                : "無"}
            </dd>
          </div>
          <div>
            <dt>示範獎勵</dt>
            <dd>{xpFor(node)} XP</dd>
          </div>
          <div>
            <dt>預計時間</dt>
            <dd>待題庫確認</dd>
          </div>
        </dl>
        <h4>學習目標／題庫範圍</h4>
        <ul className="task-objectives">
          {goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </section>
      <footer className="task-footer">
        <label htmlFor="task-progress">節點完成度</label>
        <progress id="task-progress" max={100} value={done ? 100 : 0} />
        <span>{done ? 100 : 0}%</span>
        <button
          type="button"
          className="start-learning"
          disabled={status === "locked"}
          onClick={onStart}
        >
          {status === "locked"
            ? "尚未解鎖"
            : done
              ? "查看已完成節點"
              : status === "in-progress"
                ? "▶ 繼續學習"
                : "▶ 開始學習"}
        </button>
        <button
          type="button"
          className="history-button"
          onClick={() => onShowHistory(node.id)}
        >
          <span>◷</span>
          歷史紀錄
        </button>
        {done && hasNext && (
          <button type="button" className="secondary-action" onClick={onNext}>
            前往下一節點 →
          </button>
        )}
        <p className="task-note">
          {status === "locked"
            ? "完成前置節點後即可解鎖。"
            : "目前為示範學習流程，尚未串接正式題庫。"}
        </p>
      </footer>
    </aside>
  );
}
