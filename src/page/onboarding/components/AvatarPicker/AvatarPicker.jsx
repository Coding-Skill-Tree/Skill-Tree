import { AVATARS, PAGE_TEXT } from "../../data/characterOptions.js";
import "./AvatarPicker.css";

// 用原生 radio 做選擇：一次只能選一個、方向鍵可切換、選取狀態會自動提供給輔助科技。
// 一開始沒有任何角色被選取。
function AvatarPicker({ value, onChange }) {
  return (
    <fieldset className="avatar-picker">
      <legend className="avatar-picker-legend">{PAGE_TEXT.avatarLegend}</legend>
      <ul className="avatar-grid">
        {AVATARS.map((avatar) => {
          const checked = value === avatar.id;
          return (
            <li key={avatar.id}>
              <label className={`avatar-option${checked ? " is-selected" : ""}`}>
                <input
                  className="avatar-option-input"
                  type="radio"
                  name="avatarId"
                  value={avatar.id}
                  checked={checked}
                  onChange={() => onChange(avatar.id)}
                />
                <span className="avatar-option-check" aria-hidden="true">
                  ✓
                </span>
                {/* 角色名稱已用文字顯示，圖片只是裝飾，所以 alt 留空 */}
                <img className="avatar-option-image" src={avatar.image} alt="" width="64" height="64" />
                <span className="avatar-option-name">{avatar.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export default AvatarPicker;
