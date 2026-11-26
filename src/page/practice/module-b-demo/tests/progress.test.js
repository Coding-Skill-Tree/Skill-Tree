import test from 'node:test';
import assert from 'node:assert/strict';
import {skills} from '../src/data/skills.js';
import {allNodes,getNodes,getStatus,startNode,completeNode,getStats,sanitizeProgress,nextNode} from '../src/lib/progress.js';
test('V2.1 data counts and sequential unique IDs',()=>{
 assert.deepEqual(skills.map(s=>getNodes(s).length),[20,28,36,28,20]);assert.equal(skills.reduce((n,s)=>n+s.units.length,0),26);assert.equal(new Set(allNodes.map(n=>n.id)).size,132);
 assert.equal(allNodes.filter(n=>n.type==='unit-challenge').length,21);assert.equal(allNodes.filter(n=>n.type==='final-challenge').length,5);
 for(const skill of skills)getNodes(skill).forEach((n,i,ns)=>assert.equal(n.prerequisite,ns[i-1]?.id??null));
});
test('independent first nodes, no skipping or completing without starting',()=>{
 for(const skill of skills){const [first,second]=getNodes(skill);assert.equal(getStatus(first,{}),'available');assert.equal(getStatus(second,{}),'locked');assert.deepEqual(startNode({},second.id),{});assert.deepEqual(completeNode({},first.id),{});}
});
test('completion unlocks next, XP and percentage derived once',()=>{
 const [first,second]=getNodes(skills[0]);let p=startNode({},first.id);assert.equal(getStatus(first,p),'in-progress');p=completeNode(p,first.id);assert.equal(getStatus(second,p),'available');assert.equal(nextNode(skills[0],p).id,second.id);assert.equal(completeNode(p,first.id),p);assert.equal(startNode(p,first.id),p);assert.deepEqual(getStats(getNodes(skills[0]),p),{completed:1,total:20,xp:100,level:1,percent:5});assert.equal(getStats(getNodes(skills[1]),p).percent,0);
});
test('all five routes reach 100 percent and full XP',()=>{
 let p={};for(const skill of skills)for(const n of getNodes(skill))p=completeNode(startNode(p,n.id),n.id);assert.equal(getStats(allNodes,p).completed,132);assert.equal(getStats(allNodes,p).percent,100);assert.equal(getStats(allNodes,p).xp,14750);assert.deepEqual(sanitizeProgress(p),p);
});
test('invalid persisted data removed',()=>{assert.deepEqual(sanitizeProgress({H01:'in-progress',H02:'completed',G01:'completed',J01:'unknown',X99:'completed'}),{H01:'in-progress',G01:'completed'});assert.deepEqual(sanitizeProgress(null),{});});
