import { COMING_SOON, ROUTES } from "../data/welcomeContent.js";
import { MountainFlag } from "./Decorations.jsx";

// 頁面最後一個區塊：敬請期待，附「開始挑戰」行動按鈕。
function ComingSoon() {
  return (
    <section className="coming-soon" aria-labelledby="coming-soon-title">
      <MountainFlag className="coming-soon-decoration" />
      <h2 id="coming-soon-title" className="coming-soon-title">
        {COMING_SOON.title}
      </h2>
      <p className="coming-soon-description">{COMING_SOON.description}</p>
      <a className="btn btn-primary btn-large" href={ROUTES.register}>
        {COMING_SOON.ctaLabel}
      </a>
    </section>
  );
}

export default ComingSoon;
