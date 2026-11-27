import Icon from "./Icon.jsx";
import { getNodes, getStats } from "../lib/progress.js";
export default function SkillSelector({
  skills,
  activeSkill,
  progress,
  onSelect,
}) {
  return (
    <nav className="skill-selector" aria-label="選擇學習技能">
      <ul className="skill-list">
        {skills.map((skill) => {
          const stats = getStats(getNodes(skill), progress);
          return (
            <li className="skill-item" data-skill={skill.id} key={skill.id}>
              <button
                type="button"
                className="skill-card"
                aria-pressed={activeSkill === skill.id}
                onClick={() => onSelect(skill.id)}
              >
                <Icon name={skill.id} className="skill-icon" />
                <span className="skill-card-text">
                  <strong>{skill.name}</strong>
                  <span>{skill.description}</span>
                  <span>
                    {stats.completed} / {stats.total} 節點 · {stats.percent}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
