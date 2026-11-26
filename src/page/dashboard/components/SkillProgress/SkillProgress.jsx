import "./SkillProgress.css";
import {
  Check,
  OpenBook,
  BookLock,
  NavArrowLeft,
  NavArrowRight,
} from "iconoir-react";

const SkillProgress = () => (
  <article className="panel-card skill-panel">
    <header className="panel-heading">
      <div>
        <h2>技能學習進度</h2>
      </div>
      <span className="completion-rate">
        33<small>%</small>
      </span>
    </header>
    <div className="skill-stats">
      <div>
        <span className="stat-symbol completed-symbol" aria-hidden="true">
          <Check />
        </span>
        <strong>8</strong>
        <span>已完成</span>
      </div>
      <div>
        <span className="stat-symbol progress-symbol" aria-hidden="true">
          <OpenBook />
        </span>
        <strong>3</strong>
        <span>學習中</span>
      </div>
      <div>
        <span className="stat-symbol locked-symbol" aria-hidden="true">
          <BookLock />
        </span>
        <strong>13</strong>
        <span>尚未開始</span>
      </div>
    </div>
    <div className="category-list">
      <div className="category-row">
        <div className="category-label">
          <strong>HTML</strong>
          <span>3 / 3</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="HTML完成 100%"
          aria-valuenow="100"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span className="progress-web" />
        </div>
      </div>
      <div className="category-row">
        <div className="category-label">
          <strong>CSS</strong>
          <span>5 / 8</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="CSS完成 63%"
          aria-valuenow="63"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span className="progress-style" />
        </div>
      </div>
      <div className="category-row">
        <div className="category-label">
          <strong>JavaScript</strong>
          <span>0 / 7</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="JavaScript完成 0%"
          aria-valuenow="0"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span className="progress-js" />
        </div>
      </div>
      <div className="category-row">
        <div className="category-label">
          <strong>React</strong>
          <span>0 / 6</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="React完成 0%"
          aria-valuenow="0"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span className="progress-react" />
        </div>
      </div>
      <div className="panel-bottom skill-progress">
        <a href="#" className="watch-all-progress">
          查看所有進度
        </a>
        <div className="arrow-btn-container">
          <button className="arrow-btn">
            <NavArrowLeft />
          </button>
          <button className="arrow-btn">
            <NavArrowRight />
          </button>
        </div>
      </div>
    </div>
  </article>
);

export default SkillProgress;
