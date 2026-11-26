import { useEffect, useRef, useState } from "react";
import { AVATARS, PAGE_TEXT } from "./data/characterOptions.js";
import { validateNickname } from "./utils/validateNickname.js";
import SiteHeader from "./components/SiteHeader/SiteHeader.jsx";
import NicknameField from "./components/NicknameField/NicknameField.jsx";
import AvatarPicker from "./components/AvatarPicker/AvatarPicker.jsx";
import "./CharacterCreatePage.css";

// 第一階段：只做畫面，不串 API。
// 按下「開始冒險」後模擬送出 0.8 秒，再顯示示範用的完成訊息（之後改成呼叫 API 並導向 /learn）。
const DEMO_SUBMIT_MS = 800;

function CharacterCreatePage() {
  // 輸入只存在頁面記憶體，重新整理後清空（規格要求）
  const [nickname, setNickname] = useState("");
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [avatarId, setAvatarId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const nicknameError = validateNickname(nickname);
  // 離開欄位後才開始顯示錯誤，之後邊打字邊更新
  const visibleError = nicknameTouched ? nicknameError : "";
  const canSubmit = !nicknameError && avatarId !== null && !submitting;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const payload = { username: nickname.trim(), avatarId };
    setSubmitting(true);
    setDoneMessage("");
    timerRef.current = setTimeout(() => {
      const avatarName = AVATARS.find((a) => a.id === payload.avatarId)?.name;
      setSubmitting(false);
      setDoneMessage(`（示範）角色建立完成：${payload.username}・${avatarName}`);
    }, DEMO_SUBMIT_MS);
  }

  return (
    <div className="onboarding-page">
      <SiteHeader />

      <main className="onboarding-main">
        <form className="character-card" onSubmit={handleSubmit} noValidate>
          <div className="character-card-heading">
            <p className="character-card-eyebrow">{PAGE_TEXT.eyebrow}</p>
            <h1 className="character-card-title">{PAGE_TEXT.title}</h1>
            <p className="character-card-description">{PAGE_TEXT.description}</p>
          </div>

          <NicknameField
            value={nickname}
            error={visibleError}
            onChange={setNickname}
            onBlur={() => setNicknameTouched(true)}
          />

          <AvatarPicker value={avatarId} onChange={setAvatarId} />

          <div className="character-card-actions">
            {!canSubmit && !submitting && (
              <p id="submit-hint" className="character-card-hint">
                {PAGE_TEXT.disabledHint}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={!canSubmit}
              aria-describedby={!canSubmit && !submitting ? "submit-hint" : undefined}
            >
              {submitting ? PAGE_TEXT.submittingLabel : PAGE_TEXT.submitLabel}
            </button>
          </div>

          <p className="character-card-status" role="status">
            {doneMessage}
          </p>
        </form>
      </main>
    </div>
  );
}

export default CharacterCreatePage;
