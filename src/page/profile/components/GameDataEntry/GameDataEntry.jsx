import { PROFILE_TEXT, ROUTES } from "../../data/profileContent.js";
import "./GameDataEntry.css";

// 遊戲數據入口：一般站內連結（沒有 target），在同一個分頁前往 /dashboard，鍵盤可操作。
function GameDataEntry() {
  return (
    <section className="profile-section" aria-labelledby="entry-title">
      <h2 id="entry-title" className="profile-section-title">
        {PROFILE_TEXT.entryTitle}
      </h2>
      <div className="game-data-entry">
        <p className="game-data-entry-text">{PROFILE_TEXT.entryDescription}</p>
        <a className="btn btn-primary" href={ROUTES.dashboard}>
          {PROFILE_TEXT.entryButton}
        </a>
      </div>
    </section>
  );
}

export default GameDataEntry;
