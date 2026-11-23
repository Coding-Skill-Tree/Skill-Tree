import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import "./Pagination.css";

// 分頁：＜ 第 x / y 頁 ＞。第一頁不顯示「上一頁」，最後一頁不顯示「下一頁」
// （只有一頁時兩個都不顯示）。頁碼文字固定在中間，按鈕消失時不會跟著移動。
// 按鈕只有箭頭圖示，所以用 aria-label 和 title 提供「上一頁」「下一頁」文字。
function Pagination({ page, totalPages, onChange }) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav className="pagination" aria-label="分頁">
      <div className="pagination-slot pagination-slot-prev">
        {hasPrev && (
          <button
            type="button"
            className="btn btn-secondary pagination-button"
            aria-label="上一頁"
            title="上一頁"
            onClick={() => onChange(page - 1)}
          >
            <NavArrowLeft className="pagination-icon" aria-hidden="true" focusable="false" />
          </button>
        )}
      </div>
      <p className="pagination-position" aria-live="polite">
        第 {page} / {totalPages} 頁
      </p>
      <div className="pagination-slot pagination-slot-next">
        {hasNext && (
          <button
            type="button"
            className="btn btn-secondary pagination-button"
            aria-label="下一頁"
            title="下一頁"
            onClick={() => onChange(page + 1)}
          >
            <NavArrowRight className="pagination-icon" aria-hidden="true" focusable="false" />
          </button>
        )}
      </div>
    </nav>
  );
}

export default Pagination;
