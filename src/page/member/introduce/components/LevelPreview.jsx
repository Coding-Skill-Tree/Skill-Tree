import { Check, Lock, Play, StarSolid, Star, TriangleFlag } from "iconoir-react";
import { LEVEL_NODES, LEVEL_PREVIEW, LEVEL_STATES } from "../data/welcomeContent.js";

// 每種狀態的小圖示（搭配文字，不只靠顏色）
const STATE_ICONS = { done: Check, current: Play, locked: Lock };

function Stars({ count }) {
  return (
    <span className="level-stars" aria-hidden="true">
      {[1, 2, 3].map((i) =>
        i <= count ? <StarSolid key={i} className="level-star is-earned" /> : <Star key={i} className="level-star" />,
      )}
    </span>
  );
}

// 學習地圖風格的關卡示意：一區十關，第 10 關是 Boss。
// 純示意：節點不是連結或按鈕，點了不會有反應；狀態以文字提供給輔助科技，不只靠顏色。
// 版面：768px 以下直向排列，以上橫向一排、節點之間用線連接（已通過的路段是實線，其餘是虛線）。
function LevelPreview() {
  const doneCount = LEVEL_NODES.filter((n) => n.state === "done").length;
  const percent = Math.round((doneCount / LEVEL_NODES.length) * 100);

  return (
    <section className="welcome-section level-section" aria-labelledby="level-title">
      <p className="section-eyebrow">{LEVEL_PREVIEW.eyebrow}</p>
      <h2 id="level-title" className="section-title">
        關卡長這樣
      </h2>
      <p className="level-zone">{LEVEL_PREVIEW.zoneName}</p>

      <ol className="level-map">
        {LEVEL_NODES.map((node) => {
          const stateLabel = LEVEL_STATES[node.state];
          const name = node.isBoss ? "第 10 關 Boss" : `第 ${node.number} 關`;
          const StateIcon = STATE_ICONS[node.state];
          const srText = node.stars ? `${name}，${stateLabel}，${node.stars} 顆星` : `${name}，${stateLabel}`;
          return (
            <li
              key={node.number}
              className={`level-node level-node-${node.state}${node.isBoss ? " level-node-boss" : ""}`}
            >
              {node.state === "current" && (
                <span className="level-next-badge" aria-hidden="true">
                  {LEVEL_PREVIEW.nextBadge}
                </span>
              )}
              <span className="level-node-mark" aria-hidden="true">
                {node.isBoss ? (
                  <>
                    <TriangleFlag className="level-boss-icon" />
                    <span className="level-boss-label">Boss</span>
                  </>
                ) : (
                  node.number
                )}
              </span>
              <span className="visually-hidden">{srText}</span>
              <span className="level-node-info" aria-hidden="true">
                <span className="level-node-name">{node.isBoss ? "Boss 關" : `第 ${node.number} 關`}</span>
                <Stars count={node.stars} />
                <span className="level-chip">
                  <StateIcon className="level-chip-icon" />
                  {stateLabel}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <ul className="level-legend" aria-label="圖例">
        {Object.entries(LEVEL_STATES).map(([state, label]) => {
          const Icon = STATE_ICONS[state];
          return (
            <li key={state} className={`level-legend-item level-node-${state}`}>
              <span className="level-legend-dot" aria-hidden="true">
                <Icon />
              </span>
              {label}
            </li>
          );
        })}
      </ul>

      <div className="level-progress">
        <span className="level-progress-label">{LEVEL_PREVIEW.progressLabel}</span>
        <span className="level-progress-bar" aria-hidden="true">
          <span className="level-progress-fill" style={{ width: `${percent}%` }} />
        </span>
        <span className="level-progress-text">
          {doneCount} / {LEVEL_NODES.length} 關（{percent}%）
        </span>
      </div>
    </section>
  );
}

export default LevelPreview;
