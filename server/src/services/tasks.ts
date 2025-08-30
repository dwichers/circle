import { db } from '../db/drizzle';
import { tasks } from '../db/schema';
import { eq } from 'drizzle-orm';
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
