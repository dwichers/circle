import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTask, SuggestOptions, Task } from './suggest';

const baseTask: Task = {
   id: 1,
   title: 't',
   description: null,
   priority: 'MED',
   status: 'TODO',
   dueAt: null,
   createdAt: new Date(),
   updatedAt: new Date(),
   effortMinutes: null,
   person: null,
   context: null,
   impact: null,
   waitingOn: null,
   why: null,
   projectId: null,
   assigneeId: null,
};

test('overdue tasks score higher for deadline mode', () => {
   const now = new Date();
   const past: Task = { ...baseTask, id: 1, dueAt: new Date(now.getTime() - 86400000) };
   const future: Task = { ...baseTask, id: 2, dueAt: new Date(now.getTime() + 5 * 86400000) };
   const opts: SuggestOptions = { mode: 'deadline' };
   const pastScore = scoreTask(past, opts, now).score;
   const futureScore = scoreTask(future, opts, now).score;
   assert.ok(pastScore > futureScore);
});

test('tasks that fit energy score higher', () => {
   const now = new Date();
   const small: Task = { ...baseTask, id: 3, effortMinutes: 30 };
   const big: Task = { ...baseTask, id: 4, effortMinutes: 120 };
   const opts: SuggestOptions = { mode: 'quickwins', energy: 60 };
   const smallScore = scoreTask(small, opts, now).score;
   const bigScore = scoreTask(big, opts, now).score;
   assert.ok(smallScore > bigScore);
});

test('waiting tasks get penalized', () => {
   const now = new Date();
   const ready: Task = { ...baseTask, id: 5 };
   const waiting: Task = { ...baseTask, id: 6, waitingOn: 'x' };
   const opts: SuggestOptions = { mode: 'auto' };
   const readyScore = scoreTask(ready, opts, now).score;
   const waitingScore = scoreTask(waiting, opts, now).score;
   assert.ok(readyScore > waitingScore);
});
