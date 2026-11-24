import { useEffect, useRef } from "react";

export default function HistoryModal({ node, records = [], onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="history-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="history-header">
        <span>HTML / {node.id}</span>

        <button type="button" onClick={onClose} aria-label="關閉歷史紀錄">
          ✕
        </button>
      </header>

      <h2>歷史測驗紀錄</h2>

      <p>查看「{node.title}」的歷次測驗成績</p>

      <h3>測驗紀錄</h3>
      <p>共 {records.length} 筆</p>

      {records.length === 0 ? (
        <p>目前尚無測驗紀錄。</p>
      ) : (
        <ul className="history-list">
          {records.map((record, index) => (
            <li key={record.id ?? index}>
              <div>
                <p>測驗日期：{record.date}</p>
                <p>
                  測驗分數：{record.score} / {record.total}
                </p>
              </div>

              <strong>{record.passed ? "✓ 已通過" : "✕ 未通過"}</strong>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}
