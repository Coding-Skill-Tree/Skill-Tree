import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";
import SkillUnit from "./SkillUnit.jsx";
import ProgressBar from "./ProgressBar.jsx";
export default function SkillMap({
  skill,
  stats,
  progress,
  selectedId,
  onSelect,
  view,
  onViewChange,
  onReset,
}) {
  const viewport = useRef(null);
  // Only scroll the map itself, not the surrounding page.
  useEffect(() => {
    const area = viewport.current;
    const node = document.getElementById(`node-${selectedId}`);
    if (area && node) {
      const a = area.getBoundingClientRect(),
        n = node.getBoundingClientRect();
      if (n.top < a.top || n.bottom > a.bottom)
        area.scrollTop += n.top - a.top - 80;
    }
  }, [skill.id, selectedId, view]);
  return (
    <section
      className="learning-map"
      data-skill={skill.id}
      aria-labelledby="map-title"
    >
      <header className="map-header">
        <div className="map-intro">
          <p>{skill.name.toUpperCase()} LEARNING MAP</p>
          <h2 id="map-title">
            <Icon name={skill.id} className="map-icon" />
            {skill.name} 學習地圖
          </h2>
          <p>{skill.goal}</p>
        </div>
        <dl className="map-stats">
          <div>
            <dt>目前等級</dt>
            <dd>Lv. {stats.level}</dd>
          </div>
          <div>
            <dt>已完成節點</dt>
            <dd>
              {stats.completed} / {stats.total}
            </dd>
          </div>
          <div>
            <dt>總獲得經驗</dt>
            <dd>{stats.xp.toLocaleString()} XP</dd>
          </div>
          <div>
            <dt>學習進度</dt>
            <dd>{stats.percent}%</dd>
          </div>
        </dl>
      </header>
      <div className="map-toolbar">
        <p>
          <Icon name="map" />
          學習路線：{skill.name} 基礎到實作
        </p>
        <div className="map-toolbar-controls">
          <div className="view-switch" role="group" aria-label="地圖檢視方式">
            <button
              type="button"
              aria-pressed={view === "map"}
              onClick={() => onViewChange("map")}
            >
              地圖總覽
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
            >
              節點清單
            </button>
          </div>
          {onReset && (
            <button type="button" className="map-reset-button" onClick={onReset}>
              重設進度
            </button>
          )}
        </div>
      </div>
      <div
        ref={viewport}
        className={`map-viewport ${view === "list" ? "map-list" : ""}`}
        tabIndex={0}
        aria-label="學習節點路線（可捲動）"
      >
        <div className="skill-path">
          {skill.units.map((unit) => (
            <SkillUnit
              key={unit.id}
              unit={unit}
              skillId={skill.id}
              progress={progress}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
      <ProgressBar
        id="map-progress"
        label="學習進度"
        value={stats.completed}
        max={stats.total}
        text={`${stats.completed} / ${stats.total} 節點（${stats.percent}%）`}
      />
    </section>
  );
}
