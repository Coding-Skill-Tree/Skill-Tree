import { skills } from '../data/skills.js';

export const allNodes = skills.flatMap(skill => skill.units.flatMap(unit => unit.nodes));
export const getNodes = skill => skill.units.flatMap(unit => unit.nodes);
export const nodeById = new Map(allNodes.map(node => [node.id, node]));
export const STORAGE_KEY = 'skill-tree:progress:v1';
export const statusText = { available: '可開始', 'in-progress': '進行中', completed: '已完成', locked: '尚未解鎖' };
// Demo XP rules; replace with backend-defined rules on integration.
export const xpFor = node => ({lesson: 100, 'unit-challenge': 150, 'final-challenge': 200}[node.type] ?? 0);
export const levelFor = xp => Math.floor(xp / 500) + 1;
export function getStatus(node, progress) {
  if (node.prerequisite && progress[node.prerequisite] !== 'completed') return 'locked';
  return progress[node.id] === 'completed' ? 'completed' : progress[node.id] === 'in-progress' ? 'in-progress' : 'available';
}
export function startNode(progress, nodeId) {
  const node = nodeById.get(nodeId);
  if (!node || getStatus(node, progress) !== 'available') return progress;
  return { ...progress, [nodeId]: 'in-progress' };
}
export function completeNode(progress, nodeId) {
  const node = nodeById.get(nodeId);
  if (!node || getStatus(node, progress) !== 'in-progress') return progress;
  return { ...progress, [nodeId]: 'completed' };
}
export function getStats(nodes, progress) {
  const completed = nodes.filter(node => getStatus(node, progress) === 'completed');
  const xp = completed.reduce((sum, node) => sum + xpFor(node), 0);
  return { completed: completed.length, total: nodes.length, xp, level: levelFor(xp), percent: nodes.length ? Math.round(completed.length / nodes.length * 100) : 0 };
}
export function nextNode(skill, progress) {
  const nodes = getNodes(skill);
  return nodes.find(node => getStatus(node, progress) !== 'completed' && getStatus(node, progress) !== 'locked') ?? nodes.at(-1);
}
// Discard unknown IDs, invalid statuses, and records that skip prerequisites.
export function sanitizeProgress(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
  for (const node of allNodes) {
    if (node.prerequisite && clean[node.prerequisite] !== 'completed') continue;
    if (['completed', 'in-progress'].includes(raw[node.id])) clean[node.id] = raw[node.id];
  }
  return clean;
}
