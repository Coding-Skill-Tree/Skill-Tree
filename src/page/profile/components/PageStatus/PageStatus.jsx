import { PROFILE_TEXT } from "../../data/profileContent.js";
import "./PageStatus.css";

// 確認登入狀態時的畫面：載入中（不導頁），或載入失敗＋重試按鈕。
function PageStatus({ state, onRetry }) {
  if (state === "error") {
    return (
      <div className="page-status" role="alert">
        <p className="page-status-message">
          <span aria-hidden="true">⚠ </span>
          {PROFILE_TEXT.loadFailed}
        </p>
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          {PROFILE_TEXT.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="page-status" role="status">
      <span className="page-status-spinner" aria-hidden="true" />
      <p className="page-status-message">{PROFILE_TEXT.loading}</p>
    </div>
  );
}

export default PageStatus;
