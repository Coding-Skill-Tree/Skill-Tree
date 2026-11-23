import { PAGE_TEXT } from "../../data/characterOptions.js";
import "./NicknameField.css";

// 暱稱欄位：錯誤訊息用 aria-describedby 連到欄位，並以文字＋圖示呈現，不只靠顏色。
function NicknameField({ value, error, onChange, onBlur }) {
  const hasError = Boolean(error);

  return (
    <div className="nickname-field">
      <label className="nickname-field-label" htmlFor="nickname">
        {PAGE_TEXT.nicknameLabel}
      </label>
      <input
        id="nickname"
        name="username"
        type="text"
        className={`nickname-field-input${hasError ? " is-invalid" : ""}`}
        placeholder={PAGE_TEXT.nicknamePlaceholder}
        autoComplete="nickname"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={hasError}
        aria-describedby={hasError ? "nickname-error" : "nickname-hint"}
      />
      {hasError ? (
        <p id="nickname-error" className="nickname-field-error">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : (
        <p id="nickname-hint" className="nickname-field-hint">
          {PAGE_TEXT.nicknameHint}
        </p>
      )}
    </div>
  );
}

export default NicknameField;
