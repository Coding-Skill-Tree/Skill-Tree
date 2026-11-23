import { Atom, Code, Css3, GitFork } from "iconoir-react";
import { BANNER, SKILLS } from "../data/welcomeContent.js";

// JavaScript 沒有合適的圖示，用「JS」文字方框代替
function JsIcon() {
  return (
    <span className="skill-card-js" aria-hidden="true">
      JS
    </span>
  );
}

const ICONS = {
  html: Code,
  css: Css3,
  js: JsIcon,
  react: Atom,
  git: GitFork,
};

// Banner 裡的技能卡：純展示，不是按鈕或連結。
function SkillCards() {
  return (
    <div className="skill-cards">
      <h2 className="skill-cards-title">{BANNER.skillsTitle}</h2>
      <ul className="skill-cards-list">
        {SKILLS.map((skill) => {
          const Icon = ICONS[skill.icon];
          return (
            <li key={skill.id} className="skill-card">
              <span className="skill-card-icon">
                <Icon aria-hidden="true" focusable="false" />
              </span>
              <span className="skill-card-text">
                <span className="skill-card-name">{skill.name}</span>
                <span className="skill-card-description">{skill.description}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SkillCards;
