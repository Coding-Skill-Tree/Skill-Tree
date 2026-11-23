import { PROFILE_TEXT } from "../../data/profileContent.js";
import { formatJoinDate } from "../../utils/formatJoinDate.js";
// 角色圖片和名稱沿用建立角色頁的同一份資料，確保兩頁看到的角色一致
import { AVATARS } from "../../../onboarding/data/characterOptions.js";
import "./BasicInfo.css";

// 基本資料：角色、暱稱、Email、加入日期，依序顯示，全部唯讀（沒有任何編輯功能）。
function BasicInfo({ user }) {
  const avatar = AVATARS.find((a) => a.id === user.avatarId);
  const { labels } = PROFILE_TEXT;

  return (
    <section className="profile-section" aria-labelledby="basic-info-title">
      <h2 id="basic-info-title" className="profile-section-title">
        {PROFILE_TEXT.basicInfoTitle}
      </h2>
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
      </dl>
    </section>
  );
}

export default BasicInfo;
