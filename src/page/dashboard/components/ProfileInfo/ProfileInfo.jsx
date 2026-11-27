import ImageExample from "../../../../assets/profile-image-example.png";
import "./ProfileInfo.css";
import { mockUsers } from "../../data/mockData.js";

const ProfileInfo = () => {
  return (
    <article className="profile-card">
      <img
        className="profile-avatar"
        src={ImageExample}
        alt={mockUsers["alice"].name}
      />
      <div className="profile-info-text">
        <h2>{mockUsers["alice"].name}</h2>
        <p className="profile-detail">
          <span aria-hidden="true">✉</span>
          {mockUsers["alice"].email}
        </p>
        <p className="profile-detail">
          <span aria-hidden="true">◷</span>加入時間：
          {mockUsers["alice"].startDate}
        </p>
      </div>
    </article>
  );
};

export default ProfileInfo;
