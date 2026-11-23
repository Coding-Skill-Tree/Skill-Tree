import "./InfoList.css";

// 標籤＋內容的唯讀清單（基本資料、遊戲數據共用）。
// items: [{ label, value }]，value 可以是文字或元件。
function InfoList({ items }) {
  return (
    <dl className="info-list">
      {items.map((item) => (
        <div className="info-list-item" key={item.label}>
          <dt className="info-list-label">{item.label}</dt>
          <dd className="info-list-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default InfoList;
