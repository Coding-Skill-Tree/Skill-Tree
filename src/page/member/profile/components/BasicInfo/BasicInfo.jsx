import { useEffect, useRef, useState } from "react";
import { PROFILE_TEXT, ROUTES } from "../../data/profileContent.js";
import { formatJoinDate } from "../../utils/formatJoinDate.js";
import { updateMe } from "../../utils/fakeSessionApi.js";
// 角色圖片、角色選擇、暱稱欄位與暱稱規則都沿用建立角色頁，確保兩頁一致
import { AVATARS } from "../../../onboarding/data/characterOptions.js";
import { validateNickname } from "../../../onboarding/utils/validateNickname.js";
import AvatarPicker from "../../../onboarding/components/AvatarPicker/AvatarPicker.jsx";
import NicknameField from "../../../onboarding/components/NicknameField/NicknameField.jsx";
import "./BasicInfo.css";

// 基本資料：角色、暱稱、Email、加入日期。
// 檢視狀態全部是文字；按「編輯」後，角色和暱稱在同一頁變成可以修改，Email 與加入日期維持唯讀。
// onSaved(user)：儲存成功時把新的登入資料交給頁面；onNotice(text)：顯示浮動通知。
function BasicInfo({ user, onSaved, onNotice }) {
  const { labels } = PROFILE_TEXT;
  const avatar = AVATARS.find((a) => a.id === user.avatarId);

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState(null);
  const [nicknameError, setNicknameError] = useState("");
  const [saving, setSaving] = useState(false);

  const editButtonRef = useRef(null);
  const firstRender = useRef(true);

  // 切換狀態後移動焦點：進入編輯 → 暱稱輸入框；回到檢視 → 編輯按鈕
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (editing) document.getElementById("nickname")?.focus();
    else editButtonRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setNickname(user.username);
    setAvatarId(user.avatarId);
    setNicknameError("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false); // 放棄修改，不送出請求
  }

  function handleNicknameChange(value) {
    setNickname(value);
    setNicknameError(""); // 欄位錯誤保留到暱稱被修改為止
  }

  function showNicknameError(message) {
    setNicknameError(message);
    onNotice(message);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const ruleError = validateNickname(nickname);
    if (ruleError) {
      setNicknameError(ruleError);
      document.getElementById("nickname")?.focus();
      return;
    }

    const trimmed = nickname.trim();
    if (trimmed === user.username && avatarId === user.avatarId) {
      setEditing(false); // 沒有任何修改：直接回到檢視狀態
      return;
    }

    setSaving(true);
    const result = await updateMe({ username: trimmed, avatarId }).catch(() => null);
    setSaving(false);

    const status = result?.status;
    const body = result?.body;
    if (status === 200 && body?.success) {
      onSaved(body.data);
      setEditing(false);
    } else if (status === 401) {
      window.location.replace(ROUTES.login);
    } else if (status === 409 && body?.error?.code === "USERNAME_TAKEN") {
      showNicknameError(PROFILE_TEXT.usernameTaken);
    } else if (status === 422 && body?.error?.fields?.username) {
      showNicknameError(body.error.fields.username);
    } else {
      onNotice(PROFILE_TEXT.saveFailed); // 網路錯誤、5xx、其他欄位錯誤
    }
  }

  // Email 與加入日期：兩種狀態都一樣，只能看不能改
  const readOnlyItems = (
    <>
      <div className="basic-info-item">
        <dt className="basic-info-label">{labels.email}</dt>
        <dd className="basic-info-value basic-info-email">{user.email}</dd>
      </div>
      <div className="basic-info-item">
        <dt className="basic-info-label">{labels.joinDate}</dt>
        <dd className="basic-info-value">
          <time dateTime={user.createdAt}>{formatJoinDate(user.createdAt)}</time>
        </dd>
      </div>
    </>
  );

  return (
    <section className="profile-section" aria-labelledby="basic-info-title">
      <div className="basic-info-heading">
        <h2 id="basic-info-title" className="profile-section-title">
          {PROFILE_TEXT.basicInfoTitle}
        </h2>
        {!editing && (
          <button
            ref={editButtonRef}
            type="button"
            className="btn btn-secondary btn-small"
            onClick={startEditing}
            aria-label={PROFILE_TEXT.editLabel}
          >
            {PROFILE_TEXT.edit}
          </button>
        )}
      </div>

      {editing ? (
        <form className="basic-info basic-info-form" onSubmit={handleSubmit} noValidate>
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <NicknameField value={nickname} error={nicknameError} onChange={handleNicknameChange} />
          <dl className="basic-info-readonly">{readOnlyItems}</dl>
          <div className="basic-info-actions">
            <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={saving}>
              {PROFILE_TEXT.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? PROFILE_TEXT.saving : PROFILE_TEXT.save}
            </button>
          </div>
        </form>
      ) : (
        <dl className="basic-info">
          <div className="basic-info-item">
            <dt className="basic-info-label">{labels.avatar}</dt>
            <dd className="basic-info-value basic-info-avatar">
              {avatar && (
                <img className="basic-info-avatar-image" src={avatar.image} alt="" width="48" height="48" />
              )}
              <span>{avatar ? avatar.name : user.avatarId}</span>
            </dd>
          </div>
          <div className="basic-info-item">
            <dt className="basic-info-label">{labels.username}</dt>
            <dd className="basic-info-value">{user.username}</dd>
          </div>
          {readOnlyItems}
        </dl>
      )}
    </section>
  );
}

export default BasicInfo;
