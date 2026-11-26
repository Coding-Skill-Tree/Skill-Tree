import { mockUsers, xpRecords, eventRecords } from "../data/mockData.js";
import { xpRewards } from "../data/xpReward.js";

// ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

// 邏輯：保存事件紀錄
export function recordEvent(event, status, xp, error = null, retryCount = 0) {
  // 1. 尋找是否已經存在相同的 eventId
  const index = eventRecords.findIndex(
    (record) => record.eventId === event.eventId,
  );
  // 2. 如果已經存在，更新原本紀錄
  if (index !== -1) {
    const existingRecord = eventRecords[index];
    const updatedRecord = {
      ...existingRecord,
      status,
      xp,
      error,
      retryCount: existingRecord.retryCount,
      processedAt: new Date(),
      lastAttemptAt: new Date(),
    };
    // 3. 將更新後的物件放回陣列
    eventRecords[index] = updatedRecord;
  } else {
    // 4. 如果不存在，新增紀錄
    eventRecords.push({
      eventId: event.eventId,
      userId: event.userId,
      skillNodeId: event.skillNodeId,
      isFirstPass: event.isFirstPass,
      status,
      xp,
      error,
      processedAt: new Date(),
      retryCount,
      lastAttemptAt: new Date(),
    });
  }
}

// 邏輯：重新處理錯誤事件
export function retryEvent(eventId) {
  // 重試上限
  const MAX_RETRY_COUNT = 3;

  // 1. 找到指定的事件紀錄
  const retriedEvent = eventRecords.find(
    (record) => record.eventId === eventId,
  );

  // 2. 確認事件是否存在
  if (!retriedEvent) {
    console.error("找不到指定事件");
    return;
  }

  // 3. 確認事件是否為 failed 狀態
  if (retriedEvent.status !== "failed") {
    console.error("事件不是 failed 狀態，不執行重試");
    return;
  }
  // 4. 確認是否超過重試次數限制
  if (retriedEvent.retryCount >= MAX_RETRY_COUNT) {
    console.error("已達重試上限");
    return;
  }

  // 5. 重新執行 XP 發放
  const updatedRecord = {
    ...retriedEvent,
    retryCount: retriedEvent.retryCount + 1,
  };
  const index = eventRecords.findIndex((record) => record.eventId === eventId);
  eventRecords[index] = updatedRecord;

  addXP(updatedRecord);
}

// 邏輯：計算xp的值
export function calculateXP(event) {
  if (event.isFirstPass === false) {
    return 0;
  }
  if (xpRewards[event.skillNodeId] === undefined) {
    return 0;
  }

  return xpRewards[event.skillNodeId];
}

// 邏輯：發放xp到累積經驗值
export function addXP(event) {
  // 1. 檢查事件是否已成功處理
  const isProcessed = eventRecords.some(
    (record) => record.eventId === event.eventId && record.status === "success",
  );
  if (isProcessed) {
    console.error("事件已成功處理");
    return 0;
  }

  // 2. 找到使用者
  const user = mockUsers[event.userId];
  if (user === undefined) {
    console.error("此使用者不存在資料中");
    recordEvent(event, "failed", 0, "使用者不存在");
    return 0;
  }
  // 3. 檢查技能節點是否有設定獎勵
  if (
    event.isFirstPass === true &&
    xpRewards[event.skillNodeId] === undefined
  ) {
    console.error(`找不到技能節點的xp獎勵：${event.skillNodeId}`);
    recordEvent(event, "failed", 0, "節點未定義");
    return 0;
  }

  //  4. 計算 XP
  const xp = calculateXP(event);

  //  5. 更新使用者累積 XP
  user.totalXp += xp;

  //  6. 如果 XP 大於 0，新增發放紀錄
  if (xp > 0) {
    xpRecords.push({
      eventId: event.eventId,
      userId: event.userId,
      skillNodeId: event.skillNodeId,
      xp,
    });
  }
  // 7. 保存事件處理結果
  recordEvent(event, "success", xp);

  return user.totalXp;
}
