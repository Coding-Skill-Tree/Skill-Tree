import { useState } from "react";
import { AVATARS, PAGE_TEXT, ROUTES } from "./data/characterOptions.js";
import { validateNickname } from "./utils/validateNickname.js";
import { ApiRequestError } from "../../../services/api.js";
import { completeOnboarding } from "../../../services/memberAuth.js";
import SiteHeader from "./components/SiteHeader/SiteHeader.jsx";
import NicknameField from "./components/NicknameField/NicknameField.jsx";
import AvatarPicker from "./components/AvatarPicker/AvatarPicker.jsx";
import "./CharacterCreatePage.css";

function CharacterCreatePage() {
  const [nickname, setNickname] = useState("");
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [avatarId, setAvatarId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [serverNicknameError, setServerNicknameError] = useState("");
  const [completed, setCompleted] = useState(false);

  const nicknameError = serverNicknameError || validateNickname(nickname);
  const visibleError = nicknameTouched ? nicknameError : "";
  const canSubmit = !nicknameError && avatarId !== null && !submitting && !completed;

  function updateNickname(value) {
    setNickname(value);
    setServerNicknameError("");
    setSubmitError("");
    setDoneMessage("");
    setCompleted(false);
  }

  function updateAvatar(avatar) {
    setAvatarId(avatar);
    setSubmitError("");
    setDoneMessage("");
    setCompleted(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setDoneMessage("");
    setSubmitError("");
    setServerNicknameError("");
    try {
      const profile = await completeOnboarding({ username: nickname.trim(), avatarId });
      const avatarName = AVATARS.find((a) => a.id === avatarId)?.name;
      setDoneMessage(`角色建立完成：${profile.username}・${avatarName}`);
      setCompleted(true);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "USERNAME_TAKEN") {
        setServerNicknameError(error.message);
        setNicknameTouched(true);
      } else if (error instanceof ApiRequestError && error.status === 401) {
        window.location.replace(ROUTES.login);
      } else {
        setSubmitError(PAGE_TEXT.submitFailed);
      }
    } finally {
      setSubmitting(false);
    }
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
            onChange={updateNickname}
            onBlur={() => setNicknameTouched(true)}
          />

          <AvatarPicker value={avatarId} onChange={updateAvatar} />

          <div className="character-card-actions">
            {!canSubmit && !submitting && !completed && (
              <p id="submit-hint" className="character-card-hint">
                {PAGE_TEXT.disabledHint}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={!canSubmit}
              aria-describedby={!canSubmit && !submitting && !completed ? "submit-hint" : undefined}
            >
              {submitting ? PAGE_TEXT.submittingLabel : PAGE_TEXT.submitLabel}
            </button>
          </div>

          {submitError && <p className="character-card-error" role="alert">{submitError}</p>}
          <p className="character-card-status" role="status">
            {doneMessage}
          </p>
          {completed && <a className="btn btn-primary" href={ROUTES.learn}>{PAGE_TEXT.learnLabel}</a>}
        </form>
      </main>
    </div>
  );
}

export default CharacterCreatePage;
