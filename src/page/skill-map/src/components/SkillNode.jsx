import React from 'react';
import Icon from './Icon.jsx';
import { statusText } from '../lib/progress.js';
export default function SkillNode({node,status,selected,onSelect}) {
  const done=status==='completed';
  return <li className={`skill-node is-${status} node-${node.type}`} id={`node-${node.id}`} data-node-id={node.id} data-status={status} data-prerequisite={node.prerequisite??''}>
    <button type="button" className="node-button" aria-pressed={selected} onClick={()=>onSelect(node.id)} aria-label={`${node.id} ${node.title}，${statusText[status]}`}>
      <span className="node-icon" aria-hidden="true">{done?'✓':node.type==='lesson'?node.id.slice(1):<Icon name="flag"/>}</span>
      <span className="node-title">{node.title}</span><span className="node-stars" aria-label={`${done?3:0} 顆示範星星`}>{done?'★★★':'☆☆☆'}</span>
      <span className="node-status">{status==='locked'&&<Icon name="lock"/>}{statusText[status]}</span>
    </button>
  </li>;
}
