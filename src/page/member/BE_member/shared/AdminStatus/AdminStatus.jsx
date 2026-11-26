import { COMMON_TEXT } from "../adminContent.js";
import "./AdminStatus.css";

// 載入中（轉圈＋文字），或載入失敗（訊息＋重試按鈕）。
function AdminStatus({ state, onRetry, message }) {
  if (state === "error") {
    return (
      <div className="admin-status" role="alert">
        <p className="admin-status-message admin-status-error">
          <span aria-hidden="true">⚠ </span>
          {message ?? COMMON_TEXT.loadFailed}
        </p>
        {onRetry && (
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            {COMMON_TEXT.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="admin-status" role="status">
      <span className="admin-status-spinner" aria-hidden="true" />
      <p className="admin-status-message">{COMMON_TEXT.loading}</p>
    </div>
  );
}

export default AdminStatus;
