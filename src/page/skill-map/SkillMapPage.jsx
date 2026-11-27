import { useRef, useState } from "react";
import PageHeader from "../shared-components/PageHeader.jsx";
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
import Sidebar from "../shared-components/Sidebar.jsx";
import SkillSelector from "./components/SkillSelector.jsx";
import SkillMap from "./components/SkillMap.jsx";
import TaskPanel from "./components/TaskPanel.jsx";
import LearningDialog from "./components/LearningDialog.jsx";
import "./style/skill-map.css";

// onShowHistory(nodeId) 由歷史紀錄模組提供；尚未整合時顯示提示而非建立假資料。
export default function SkillMapPage({ onShowHistory }) {
  const { progress, storageError, start, complete, reset } = useProgress();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavToggleRef = useRef(null);
  const totalStats = getStats(allNodes, progress);
  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
    mobileNavToggleRef.current?.focus();
  };
  const [activeSkill, setActiveSkill] = useState("html");
  const [selectedBySkill, setSelectedBySkill] = useState({});
  const [view, setView] = useState("map");
  const [sessionId, setSessionId] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [historyNotice, setHistoryNotice] = useState("");
  const skill = skills.find((s) => s.id === activeSkill);
  const nodes = getNodes(skill);
  const node =
    nodes.find((n) => n.id === selectedBySkill[activeSkill]) ??
    nextNode(skill, progress);
  const status = getStatus(node, progress);
  const stats = getStats(nodes, progress);
  const upcoming = nodes[nodes.findIndex((n) => n.id === node.id) + 1];
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
    <div className="skill-map-page app-layout">
      <Sidebar
        user={{
          name: "前端學習者",
          avatar: "ST",
          level: totalStats.level,
          xp: totalStats.xp,
        }}
        isMobileNavOpen={isMobileNavOpen}
        onCloseMobileNav={closeMobileNav}
      />
      <main className="main-content" id="main-content">
        <PageHeader
          title="選擇前端學習技能"
          description="挑選一個你想精進的前端技能，展開專屬的學習地圖。"
          eyebrow="CHOOSE YOUR SKILL"
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          mobileNavToggleRef={mobileNavToggleRef}
        />
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
        {historyNotice && (
          <p className="integration-notice" role="status">
            {historyNotice}
          </p>
        )}
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
              onReset={resetDemo}
            />
          </div>
          <TaskPanel
            skill={skill}
            node={node}
            status={status}
            onStart={openLearning}
            hasNext={Boolean(upcoming)}
            onNext={() => upcoming && selectNode(upcoming.id)}
            onShowHistory={(id) => {
              if (onShowHistory) onShowHistory(id);
              else {
                setHistoryNotice(
                  `已選擇 ${id}：歷史紀錄視窗待與組員的元件整合。`,
                );
              }
            }}
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
      </main>
    </div>
  );
}
