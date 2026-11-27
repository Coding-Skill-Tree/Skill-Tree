import SkillNode from './SkillNode.jsx';
import { getStatus } from '../lib/progress.js';
export default function SkillUnit({unit,skillId,progress,selectedId,onSelect}) {
  const completed=unit.nodes.filter(n=>getStatus(n,progress)==='completed').length;
  return <section className="skill-unit" data-unit={unit.id} aria-labelledby={`unit-${skillId}-${unit.id}`}>
    <header className="unit-header"><p>UNIT {unit.id}</p><h3 id={`unit-${skillId}-${unit.id}`}>{unit.title}</h3><p>{completed} / {unit.nodes.length} 節點</p></header>
    <ol className="node-list">{unit.nodes.map(node=><SkillNode key={node.id} node={node} status={getStatus(node,progress)} selected={selectedId===node.id} onSelect={onSelect}/>)}</ol>
  </section>;
}
