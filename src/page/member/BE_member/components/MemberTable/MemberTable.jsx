import { ADMIN_ROUTES, COMMON_TEXT } from "../../shared/adminContent.js";
import "./MemberTable.css";

const COLUMNS = ["暱稱", "Email", "狀態"];

// 會員列表：768px 以上是表格，以下每位會員是一張卡片（同一份 HTML，靠 CSS 切換）。
// 卡片模式用 data-label 顯示欄位名稱。點暱稱進入會員詳情，並帶著目前的搜尋條件，方便返回。
// 角色與加入日期只在會員詳情頁顯示。
function MemberTable({ items, backQuery }) {
  return (
    <table className="member-table">
      <caption className="visually-hidden">會員列表</caption>
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th key={col} scope="col">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((m) => {
          const href = `${ADMIN_ROUTES.memberDetail(m.userId)}${
            backQuery ? `&from=${encodeURIComponent(backQuery)}` : ""
          }`;
          return (
            <tr key={m.userId}>
              <td data-label={COLUMNS[0]}>
                <a className="member-table-name" href={href}>
                  {m.username ?? COMMON_TEXT.notSet}
                </a>
              </td>
              <td data-label={COLUMNS[1]} className="member-table-email">
                {m.email}
              </td>
              <td data-label={COLUMNS[2]}>
                {m.suspended ? (
                  <span className="status-badge status-badge-suspended">
                    <span aria-hidden="true">⛔</span>
                    {COMMON_TEXT.statusSuspended}
                  </span>
                ) : (
                  <span className="status-badge status-badge-active">
                    <span aria-hidden="true">✓</span>
                    {COMMON_TEXT.statusActive}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default MemberTable;
