// 假資料：由C傳過來的事件
export const testEvent = {
  eventId: "event-001",
  userId: "alice",
  skillNodeId: "JS-001",
  isFirstPass: true,
};

// 假會員資料
export const mockUsers = {
  alice: {
    userId: "alice",
    name: "alice",
    email: "matt02416@gmail.com",
    startDate: "2026-11-26",
    totalXp: 100,
  },
};

// 保存xp紀錄：userId、xp、skillNodeId、eventId、isFirstPass
export const xpRecords = [];
/*
  {
    eventId: "event-001",
    userId: "alice",
    status: "success",
    xp: 15,
    skillNodeId: "JS-001",
    isFirstPass: true,
  },
*/

// 保存事件紀錄：eventId、userId、status、xp、error、processedAt
export const eventRecords = [];

/*
  {
    eventId: "event-001",
    userId: "alice",
    status: "success",
    xp: 15,
    error: null,
    processedAt: new Date(),
    retryCount: 1,
    lastAttemptAt: new Date()
    skillNodeId: "JS-001",
    isFirstPass: true,
  },
*/
