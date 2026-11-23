// 角色圖片和名稱沿用建立角色頁的同一份資料
import { AVATARS } from "../../onboarding/data/characterOptions.js";
import { COMMON_TEXT } from "./adminContent.js";

// 會員的角色：有角色時顯示圖片（＋可選的名稱文字），沒有時顯示虛線空白框。
// showName = false 時，名稱只提供給輔助科技（列表用）。
function MemberAvatar({ avatarId, showName = false }) {
  const avatar = AVATARS.find((a) => a.id === avatarId);

  if (!avatar) {
    return (
      <span className="admin-avatar-wrap">
        <span className="admin-avatar admin-avatar-empty" aria-hidden="true" />
        {showName ? <span>{COMMON_TEXT.notSet}</span> : <span className="visually-hidden">{COMMON_TEXT.notSet}</span>}
      </span>
    );
  }

  return (
    <span className="admin-avatar-wrap">
      <img className="admin-avatar" src={avatar.image} alt="" width="40" height="40" />
      <span className={showName ? undefined : "visually-hidden"}>{avatar.name}</span>
    </span>
  );
}

export default MemberAvatar;
