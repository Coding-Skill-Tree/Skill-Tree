// 遊戲數據的顯示格式（規格已先固定，之後的 change 只要提供資料）。
// 沒有資料（null 或空陣列）時一律顯示「尚無資料」。

export const NO_DATA = "尚無資料";

export function formatXp(xp) {
  return typeof xp === "number" ? `${xp} XP` : NO_DATA;
}

export function formatLevel(level) {
  return typeof level === "number" ? `Lv. ${level}` : NO_DATA;
}

// 回傳每門課一行的陣列，依收到的順序；沒有資料時回傳 null
export function formatCourseProgress(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((c) => `${c.courseName} 第 ${c.currentLevel} / ${c.totalLevels} 關`);
}
