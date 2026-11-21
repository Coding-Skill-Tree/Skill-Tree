import { useState } from "react";
import { Eye, EyeClosed } from "iconoir-react";
// 欄位外觀沿用忘記密碼頁的 TextField
import TextField from "../../../forget_pwd/components/TextField/TextField.jsx";

// 密碼欄位：預設隱藏內容，右邊的眼睛按鈕可切換顯示／隱藏。
// 圖示代表「按下去會怎樣」：隱藏中顯示睜眼（按了會顯示），顯示中顯示閉眼（按了會隱藏）。
// 按鈕只有圖示，所以用 aria-label 和 title 提供文字說明。
function PasswordField({ id, label, disabled = false, ...rest }) {
  const [visible, setVisible] = useState(false);
  const actionText = `${visible ? "隱藏" : "顯示"}${label}`;
  const Icon = visible ? EyeClosed : Eye;

  return (
    <TextField
      {...rest}
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      disabled={disabled}
      trailing={
        <button
          type="button"
          className="btn btn-ghost text-field-toggle"
          aria-label={actionText}
          title={actionText}
          aria-controls={id}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon className="text-field-toggle-icon" aria-hidden="true" focusable="false" />
        </button>
      }
    />
  );
}

export default PasswordField;
