import HistoryModal from "./components/HistoryModal.jsx";
import React, { useState } from "react";
import { skills } from "./data/skills.js";
import {
  allNodes,
  getNodes,
  getStats,
  getStatus,
  nextNode,
  nodeById,
} from "./lib/progress.js";
import { useProgress } from "./hooks/useProgress.js";
import Sidebar from "./components/Sidebar.jsx";
import SkillSelector from "./components/SkillSelector.jsx";
import SkillMap from "./components/SkillMap.jsx";
import TaskPanel from "./components/TaskPanel.jsx";
import LearningDialog from "./components/LearningDialog.jsx";
export default function App() {
  const { progress, storageError, start, complete, reset } = useProgress();
  const [activeSkill, setActiveSkill] = useState("html");
  const [selectedBySkill, setSelectedBySkill] = useState({});
  const [view, setView] = useState("map");
  const [sessionId, setSessionId] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const skill = skills.find((s) => s.id === activeSkill);
  const nodes = getNodes(skill);
  const node =
    nodes.find((n) => n.id === selectedBySkill[activeSkill]) ??
    nextNode(skill, progress);
  const status = getStatus(node, progress);
  const stats = getStats(nodes, progress);
  const upcoming = nodes[nodes.findIndex((n) => n.id === node.id) + 1];
  const [historyNodeId, setHistoryNodeId] = useState(null);
  function selectNode(id, bringPanel = false) {
    setSelectedBySkill((previous) => ({ ...previous, [activeSkill]: id }));
    if (bringPanel && window.matchMedia("(max-width: 850px)").matches)
      requestAnimationFrame(() =>
        document
          .getElementById("task-panel")
          ?.scrollIntoView({ block: "nearest" }),
      );
  }
  function openLearning() {
    if (status === "locked") return;
    start(node.id);
    setSessionId(node.id);
  }
  function finishLearning() {
    if (
      !sessionId ||
      getStatus(nodeById.get(sessionId), progress) !== "in-progress"
    )
      return;
    const next = nodes[nodes.findIndex((n) => n.id === sessionId) + 1];
    complete(sessionId);
    setSelectedBySkill((previous) => ({
      ...previous,
      [activeSkill]: next?.id ?? sessionId,
    }));
    setSessionId(null);
    setAnnouncement(`${sessionId} 示範完成，學習進度已更新。`);
  }
  function resetDemo() {
    if (window.confirm("確定清除本裝置的全部示範學習紀錄？")) {
      reset();
      setSelectedBySkill({});
      setSessionId(null);
      setAnnouncement("示範進度已清除。");
    }
  }
  return (
    <div className="app-layout">
      <Sidebar stats={getStats(allNodes, progress)} />
      <main className="main-content" id="main-content">
        <header className="page-header">
          <div className="page-heading">
            <p>CHOOSE YOUR SKILL</p>
            <h1>選擇前端學習技能</h1>
            <p>挑選一個你想精進的前端技能，展開專屬的學習地圖。</p>
          </div>
          <div className="header-actions">
            <button type="button" className="reset-small" onClick={resetDemo}>
              重設進度
            </button>
          </div>
        </header>
        <p className="demo-banner">開發測試版 · 示範通關 / 本機進度儲存</p>
        {storageError && (
          <p className="storage-warning" role="alert">
            瀏覽器儲存空間無法寫入，重新整理可能遺失進度。
          </p>
        )}
        <SkillSelector
          skills={skills}
          activeSkill={activeSkill}
          progress={progress}
          onSelect={setActiveSkill}
        />
        <div className="learning-layout">
          <div className="learning-maps">
            <SkillMap
              key={skill.id}
              skill={skill}
              stats={stats}
              progress={progress}
              selectedId={node.id}
              onSelect={(id) => selectNode(id, true)}
              view={view}
              onViewChange={setView}
            />
          </div>
          <TaskPanel
            skill={skill}
            node={node}
            status={status}
            onStart={openLearning}
            hasNext={Boolean(upcoming)}
            onNext={() => upcoming && selectNode(upcoming.id)}
            onShowHistory={setHistoryNodeId}
          />
        </div>
        <p className="sr-only" role="status">
          {announcement}
        </p>
        {sessionId && (
          <LearningDialog
            key={sessionId}
            node={nodeById.get(sessionId)}
            completed={progress[sessionId] === "completed"}
            onClose={() => setSessionId(null)}
            onComplete={finishLearning}
          />
        )}

        {/* 新增：歷史測驗紀錄視窗 */}
        {historyNodeId && (
          <HistoryModal
            node={nodeById.get(historyNodeId)}
            records={[]}
            onClose={() => setHistoryNodeId(null)}
          />
        )}
      </main>
    </div>
  );
}
