import ImageExample from "../../../../assets/profile-image-example.png";
import "./ProfileInfo.css";

const ProfileInfo = () => (
  <article className="profile-card">
    <img className="profile-avatar" src={ImageExample} alt="在用筆電的貓" />
    <div className="profile-info-text">
      <h2>Nini</h2>
      <p className="profile-detail">
        <span aria-hidden="true">✉</span>matt02416@gmail.com
      </p>
      <p className="profile-detail">
        <span aria-hidden="true">◷</span>加入時間：2026 年 11 月
      </p>
    </div>
  </article>
);

export default ProfileInfo;
