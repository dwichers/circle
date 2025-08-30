import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createTask, updateTask, completeTask, listTasks } from '../services/tasks';
import { suggestNext } from '../domain/suggest';

const server = new McpServer({ name: 'circle-mcp', version: '0.1.0' });

const createTaskSchema = z.object({
   title: z.string(),
   description: z.string().optional(),
   projectId: z.string().optional(),
   due_at: z.coerce.date().optional(),
   effort_minutes: z.number().int().optional(),
   person: z.string().optional(),
   context: z.string().optional(),
   impact: z.string().optional(),
   why: z.string().optional(),
});

server.registerTool(
   'create_task',
   {
      title: 'Create task',
      description: 'Create a task',
      inputSchema: createTaskSchema,
   },
   async (input) => {
      const data = createTaskSchema.parse(input);
      const task = await createTask({
         title: data.title,
         description: data.description,
         projectId: data.projectId,
         dueAt: data.due_at,
         effortMinutes: data.effort_minutes,
         person: data.person,
         context: data.context,
         impact: data.impact,
         why: data.why,
      });
      return { content: [{ type: 'text', text: JSON.stringify(task) }] };
   }
);

const listTasksSchema = z.object({
   q: z.string().optional(),
   status: z.string().optional(),
   projectId: z.string().optional(),
   limit: z.number().int().optional(),
   offset: z.number().int().optional(),
});

server.registerTool(
   'list_tasks',
   {
      title: 'List tasks',
      description: 'List tasks with optional filters',
      inputSchema: listTasksSchema,
   },
   async (input) => {
      const params = listTasksSchema.parse(input);
      const rows = await listTasks(params);
      return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
   }
);

const patchSchema = z.object({
   title: z.string().optional(),
   description: z.string().optional(),
   projectId: z.string().optional(),
   due_at: z.coerce.date().optional(),
   effort_minutes: z.number().int().optional(),
   person: z.string().optional(),
   context: z.string().optional(),
   impact: z.string().optional(),
   why: z.string().optional(),
   status: z.string().optional(),
   priority: z.string().optional(),
   waiting_on: z.string().optional(),
});

const updateTaskSchema = z.object({
   id: z.number().int(),
   patch: patchSchema,
});

server.registerTool(
   'update_task',
   {
      title: 'Update task',
      description: 'Update a task by id',
      inputSchema: updateTaskSchema,
   },
   async (input) => {
      const { id, patch } = updateTaskSchema.parse(input);
      const task = await updateTask(id, {
         title: patch.title,
         description: patch.description,
         projectId: patch.projectId,
         dueAt: patch.due_at,
         effortMinutes: patch.effort_minutes,
         person: patch.person,
         context: patch.context,
         impact: patch.impact,
         why: patch.why,
         status: patch.status,
         priority: patch.priority,
         waitingOn: patch.waiting_on,
      });
      return { content: [{ type: 'text', text: JSON.stringify(task) }] };
   }
);

const completeTaskSchema = z.object({ id: z.number().int() });

server.registerTool(
   'complete_task',
   {
      title: 'Complete task',
      description: 'Mark a task as complete',
      inputSchema: completeTaskSchema,
   },
   async (input) => {
      const { id } = completeTaskSchema.parse(input);
      const task = await completeTask(id);
      return { content: [{ type: 'text', text: JSON.stringify(task) }] };
   }
);

const suggestNextSchema = z.object({
   mode: z.enum(['auto', 'deadline', 'impact', 'quickwins']).optional(),
   energy: z.number().int().optional(),
   person: z.string().optional(),
});

server.registerTool(
   'suggest_next',
   {
      title: 'Suggest next tasks',
      description: 'Suggest next tasks to work on',
      inputSchema: suggestNextSchema,
   },
   async (input) => {
      const { mode, energy, person } = suggestNextSchema.parse(input);
      const suggestions = await suggestNext({
         mode: (mode as any) ?? 'auto',
         energy,
         person,
      });
      return { content: [{ type: 'text', text: JSON.stringify(suggestions) }] };
   }
);

const transport = new StdioServerTransport();
await server.connect(transport);
