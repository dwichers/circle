import { tasks } from '../db/schema';
import { and, eq, ne } from 'drizzle-orm';

export type Task = typeof tasks.$inferSelect;

export type SuggestMode = 'auto' | 'deadline' | 'impact' | 'quickwins';

export interface SuggestOptions {
   mode: SuggestMode;
   context?: string;
   person?: string;
   energy?: number; // available minutes
}

interface ScoreResult {
   score: number;
   reason: string;
}

const impactMap: Record<string, number> = { LOW: 1, MED: 2, HIGH: 3 };
const priorityMap: Record<string, number> = { LOW: 1, MED: 2, HIGH: 3, URGENT: 4 };

function ageInDays(date: Date, now: Date) {
   return (now.getTime() - date.getTime()) / 86_400_000;
}

const modeWeights: Record<SuggestMode, Record<string, number>> = {
   auto: { deadline: 3, impact: 2, priority: 1, aging: 1, person: 2, effort: 3, waiting: 2 },
   deadline: { deadline: 5, impact: 1, priority: 1, aging: 1, person: 1, effort: 1, waiting: 1 },
   impact: { deadline: 1, impact: 5, priority: 1, aging: 1, person: 1, effort: 1, waiting: 1 },
   quickwins: { deadline: 1, impact: 1, priority: 1, aging: 1, person: 1, effort: 5, waiting: 5 },
};

export function scoreTask(task: Task, opts: SuggestOptions, now: Date = new Date()): ScoreResult {
   const w = modeWeights[opts.mode];
   let score = 0;
   const reasons: string[] = [];

   // Deadline urgency
   if (task.dueAt) {
      const days = (task.dueAt.getTime() - now.getTime()) / 86_400_000;
      const urgency = days <= 0 ? 1 : 1 / (1 + days);
      score += urgency * w.deadline * 10;
      reasons.push(`deadline ${days <= 0 ? 'overdue' : `${Math.round(days)}d`}`);
   }

   // Impact
   if (task.impact) {
      const val = impactMap[task.impact] ?? 0;
      score += val * w.impact * 5;
      reasons.push(`impact ${task.impact}`);
   }

   // Priority
   if (task.priority) {
      const val = priorityMap[task.priority] ?? 0;
      score += val * w.priority * 2;
      reasons.push(`priority ${task.priority}`);
   }

   // Aging
   if (task.createdAt) {
      const age = ageInDays(task.createdAt, now);
      const val = Math.min(age / 30, 1); // max at 30 days
      score += val * w.aging * 5;
      reasons.push(`age ${Math.round(age)}d`);
   }

   // Person weight
   if (opts.person && task.person === opts.person) {
      score += w.person * 5;
      reasons.push('you');
   }

   // Effort vs energy
   if (opts.energy && task.effortMinutes) {
      const ratio = opts.energy / task.effortMinutes;
      const val = Math.min(ratio, 1);
      score += val * w.effort * 10;
      reasons.push(`effort ${task.effortMinutes}m`);
   }

   // Waiting resolved
   if (task.waitingOn) {
      score -= w.waiting * 5;
      reasons.push('waiting');
   } else {
      score += w.waiting * 5;
   }

   return { score, reason: reasons.join(', ') };
}

export async function suggestNext(opts: SuggestOptions) {
   const { db } = await import('../db/drizzle');
   const now = new Date();
   const whereClauses = [ne(tasks.status, 'DONE')];
   if (opts.context) {
      whereClauses.push(eq(tasks.context, opts.context));
   }
   if (opts.person) {
      whereClauses.push(eq(tasks.person, opts.person));
   }

   const rows = await db
      .select()
      .from(tasks)
      .where(and(...whereClauses));

   const suggestions = rows
      .map((task) => {
         const { score, reason } = scoreTask(task as Task, opts, now);
         return { task, score, reason };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

   return suggestions;
}

export type Suggestion = Awaited<ReturnType<typeof suggestNext>>[number];
