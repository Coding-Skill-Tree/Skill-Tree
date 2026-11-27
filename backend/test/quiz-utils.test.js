import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectQuestions } from '../src/lib/quiz-utils.js';

test('question selection returns a bounded, unique shuffled subset without mutating the source', () => {
  const questions = ['a', 'b', 'c', 'd', 'e'];
  const selected = selectQuestions(questions, 3, () => 0);

  assert.deepEqual(selected, ['b', 'c', 'd']);
  assert.equal(new Set(selected).size, 3);
  assert.deepEqual(questions, ['a', 'b', 'c', 'd', 'e']);
});

test('question selection rejects invalid counts', () => {
  assert.throws(() => selectQuestions(['a'], 2), TypeError);
  assert.throws(() => selectQuestions(['a'], -1), TypeError);
  assert.throws(() => selectQuestions(['a'], 1.5), TypeError);
});
