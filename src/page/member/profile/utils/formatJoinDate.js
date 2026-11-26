// 把帳號建立時間（ISO 8601 UTC 字串）轉成「裝置所在時區」的日曆日期 YYYY/MM/DD。
// 用 Intl.DateTimeFormat 取出年、月、日再自己組合，
// 所以不論裝置的語言或地區設定是什麼，格式都一樣，只有時區會影響日期。
// timeZone 省略時用裝置的時區；測試時可傳入例如 "Asia/Taipei"。
export function formatJoinDate(isoString, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoString));

  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}/${get("month")}/${get("day")}`;
}
