import "./QuizHistoryModal.css";
import { Xmark } from "iconoir-react";
import { CheckCircle, XmarkCircle } from "iconoir-react";
import { PageEdit } from "iconoir-react";
import { FastArrowDownSquareSolid } from "iconoir-react";
import { useState } from "react";
function QuizHistoryModal() {
  const [visibleCount, setVisibleCount] = useState(10);
  const historyRecords = [
    {
      id: 1,
      date: "2026/11/22",
      score: 5,
      total: 5,
      passed: true,
    },
    {
      id: 2,
      date: "2026/11/21",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 3,
      date: "2026/11/20",
      score: 3,
      total: 5,
      passed: false,
    },
    {
      id: 4,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 5,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 6,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 7,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 8,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 9,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 10,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 11,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 12,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: true,
    },
    {
      id: 13,
      date: "2026/11/19",
      score: 4,
      total: 5,
      passed: false,
    },
  ];
  return (
    <div className="quiz-history-modal">
      <div className="quiz-history-content">
        <header className="quiz-history-header">
          <span>HTML / H01</span>
          <button
            type="button"
            aria-label="關閉歷史紀錄視窗"
            className="quiz-history-close"
          >
            <Xmark />
          </button>
        </header>

        <h2>歷史測驗紀錄</h2>
        <p>查看「確認網頁與 HTML 」的歷次測驗成績</p>

        <section className="quiz-history-records">
          <div className="quiz-history-records-header">
            <h3>測驗紀錄</h3>
            <span>共 {historyRecords.length} 筆</span>
          </div>
          {historyRecords.length === 0 ? (
            <div className="quiz-history-empty">
              <PageEdit />
              <p>目前沒有測驗紀錄</p>
              <p>完成第一次測驗後，紀錄就會顯示在這裡。</p>
            </div>
          ) : (
            historyRecords.slice(0, visibleCount).map((record) => (
              <div className="quiz-history-card" key={record.id}>
                <div className="quiz-history-card-header">
                  <h4>測驗日期：{record.date}</h4>
                  <p
                    className={`quiz-history-status ${
                      record.passed
                        ? "quiz-history-passed"
                        : "quiz-history-failed"
                    }`}
                  >
                    {record.passed ? <CheckCircle /> : <XmarkCircle />}
                    {record.passed ? "已通過" : "未通過"}
                  </p>
                </div>
                <p>
                  測驗分數：{record.score} / {record.total}
                </p>
              </div>
            ))
          )}
          {historyRecords.length > visibleCount && (
            <div className="quiz-history-load">
              <button
                type="button"
                className="quiz-history-load-more"
                onClick={() => setVisibleCount((prev) => prev + 10)}
              >
                載入更多
                <FastArrowDownSquareSolid />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default QuizHistoryModal;
