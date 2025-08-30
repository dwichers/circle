import { db } from '../db/drizzle';
import { tasks } from '../db/schema';
import { and, eq, like } from 'drizzle-orm';
import { broadcast } from '../ws';

export type NewTask = typeof tasks.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type UpdateTask = Partial<Omit<NewTask, 'id'>>;

export async function createTask(data: NewTask) {
   const [task] = await db.insert(tasks).values(data).returning();
   broadcast({ event: 'tasks.updated', payload: { type: 'create', task } });
   return task;
}

export async function updateTask(id: number, data: UpdateTask) {
   const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
   broadcast({ event: 'tasks.updated', payload: { type: 'update', task } });
   return task;
}

export async function completeTask(id: number) {
   const [task] = await db
      .update(tasks)
      .set({ status: 'DONE' })
      .where(eq(tasks.id, id))
      .returning();
   broadcast({ event: 'tasks.updated', payload: { type: 'complete', task } });
   return task;
}

export async function listTasks(opts: {
   q?: string;
   status?: string;
   projectId?: string;
   limit?: number;
   offset?: number;
}) {
   let query = db.select().from(tasks);
   const where = [] as any[];
   if (opts.q) {
      where.push(like(tasks.title, `%${opts.q}%`));
   }
   if (opts.status) {
      where.push(eq(tasks.status, opts.status));
   }
   if (opts.projectId) {
      where.push(eq(tasks.projectId, opts.projectId));
   }
   if (where.length) {
      query = query.where(and(...where));
   }
   if (typeof opts.limit === 'number') {
      query = query.limit(opts.limit);
   }
   if (typeof opts.offset === 'number') {
      query = query.offset(opts.offset);
   }
   const rows = await query;
   return rows;
}
