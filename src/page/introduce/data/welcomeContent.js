// 歡迎頁面的靜態展示內容（第一階段不串接 API）。
// 圖片目前是示意假圖，換成正式圖稿時只要替換 assets/placeholders 裡的檔案。
import mapImage from "../assets/placeholders/skill-map.svg";
import quizImage from "../assets/placeholders/quiz.svg";
import growthImage from "../assets/placeholders/growth.svg";
import xpImage from "../assets/placeholders/xp.svg";
import levelImage from "../assets/placeholders/level.svg";

export const SITE_NAME = "Skill Tree";
export const SITE_TAGLINE = "前端學習與實作平台";

export const ROUTES = {
  login: "/login",
  register: "/register",
};

export const BANNER = {
  eyebrow: "CHOOSE YOUR SKILL",
  title: "打怪升級，學會寫程式",
  description: "用遊戲化的技能樹，一關一關學會多種程式語言。",
  ctaLabel: "開始學習",
  skillsTitle: "可以學的技能",
};

// Banner 下方的技能卡（純展示，不可點擊）。icon 對應 SkillCards 元件裡的圖示。
export const SKILLS = [
  { id: "html", name: "HTML", description: "網頁結構與基礎", icon: "html" },
  { id: "css", name: "CSS", description: "樣式設計與排版", icon: "css" },
  { id: "js", name: "JavaScript", description: "互動與網頁邏輯", icon: "js" },
  { id: "react", name: "React", description: "元件化開發框架", icon: "react" },
  { id: "git", name: "Git", description: "版本控制與協作", icon: "git" },
];

export const FEATURES = [
  {
    id: "skill-map",
    title: "技能樹地圖",
    description: "多種程式語言的課程排成一張技能樹地圖，學習者一區一區解鎖。",
    image: mapImage,
    imageAlt: "技能樹地圖示意圖",
  },
  {
    id: "quest-learning",
    title: "闖關學習",
    description: "每一關教一個重點，並用選擇題或填空題檢驗，答題後立即知道對錯。",
    image: quizImage,
    imageAlt: "闖關學習示意圖",
  },
  {
    id: "growth-record",
    title: "成長紀錄",
    description: "學習者獲得 XP 並提升等級。",
    image: growthImage,
    imageAlt: "成長紀錄示意圖",
  },
];

export const LEVEL_STATES = {
  done: "已通過",
  current: "可挑戰",
  locked: "未解鎖",
};

// 一區十關：1–3 已通過、4 可挑戰、5–10 未解鎖，第 10 關是 Boss。
// stars：已通過的關卡得到的星星數（示意，最多 3 顆）。
const DONE_STARS = { 1: 3, 2: 3, 3: 2 };
export const LEVEL_NODES = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  let state = "locked";
  if (number <= 3) state = "done";
  else if (number === 4) state = "current";
  return { number, state, isBoss: number === 10, stars: DONE_STARS[number] ?? 0 };
});

export const LEVEL_PREVIEW = {
  eyebrow: "LEARNING MAP",
  zoneName: "示意關卡區：HTML 基礎",
  nextBadge: "下一個",
  progressLabel: "學習進度",
};

export const REWARDS = [
  {
    id: "xp",
    name: "XP 經驗值",
    description: "通過關卡可以獲得 XP",
    sampleValue: "+50 XP",
    image: xpImage,
    imageAlt: "XP 經驗值示意圖",
  },
  {
    id: "level",
    name: "等級",
    description: "累積 XP 會提升等級",
    sampleValue: "Lv. 3",
    image: levelImage,
    imageAlt: "等級示意圖",
  },
];

export const COMING_SOON = {
  title: "敬請期待",
  description: "更多獎勵即將推出",
  ctaLabel: "開始挑戰",
};
