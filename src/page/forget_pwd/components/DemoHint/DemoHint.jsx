import "./DemoHint.css";

// 示範說明區塊：第一階段讓大家看到各種狀態用，串 API 後整個刪掉。
function DemoHint({ children }) {
  return (
    <aside className="demo-hint" aria-label="示範說明">
      <p className="demo-hint-title">示範（第一階段，串 API 後刪除）</p>
      {children}
    </aside>
  );
}

export default DemoHint;
