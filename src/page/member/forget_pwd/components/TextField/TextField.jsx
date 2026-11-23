import "./TextField.css";

// 文字欄位：標籤、輸入框、提示或錯誤訊息。
// 錯誤訊息用 aria-describedby 連到欄位，以 ⚠＋文字＋紅框呈現，不只靠顏色；
// errorAction 可以在錯誤後面接一個連結（例如「前往註冊」）。
// trailing 放在輸入框右邊（例如密碼的顯示／隱藏按鈕）。
function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  errorAction,
  hint,
  placeholder,
  autoComplete,
  disabled = false,
  inputRef,
  trailing,
}) {
  const hasError = Boolean(error);
  const describedBy = hasError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="text-field">
      <label className="text-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="text-field-control">
        <input
          ref={inputRef}
          id={id}
          type={type}
          className={`text-field-input${hasError ? " is-invalid" : ""}`}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={describedBy}
        />
        {trailing}
      </div>
      {hasError ? (
        <p id={`${id}-error`} className="text-field-error">
          <span aria-hidden="true">⚠</span>
          <span>
            {error}
            {errorAction && (
              <>
                {" "}
                <a className="text-field-error-link" href={errorAction.href}>
                  {errorAction.label}
                </a>
              </>
            )}
          </span>
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export default TextField;
