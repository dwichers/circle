import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { setupWebsocket } from './ws';
import { createTask, updateTask, completeTask } from './services/tasks';
import { suggestNext } from './domain/suggest';

const app = Fastify({ logger: true });

setupWebsocket(app);

app.register(cors, { origin: true });

app.get('/health', async () => ({ ok: true }));

app.post('/tasks', async (request, reply) => {
   const task = await createTask(request.body as any);
   reply.send(task);
});

app.put('/tasks/:id', async (request, reply) => {
   const { id } = request.params as { id: string };
   const task = await updateTask(Number(id), request.body as any);
   reply.send(task);
});

app.post('/tasks/:id/complete', async (request, reply) => {
   const { id } = request.params as { id: string };
   const task = await completeTask(Number(id));
   reply.send(task);
});

app.get('/suggest', async (request, reply) => {
   const {
      mode = 'auto',
      limit = '5',
      context,
      person,
      energy,
   } = request.query as Record<string, string>;

   const suggestions = await suggestNext({
      mode: mode as any,
      context,
      person,
      energy: energy ? Number(energy) : undefined,
   });

   reply.send(suggestions.slice(0, Number(limit)));
});

const start = async () => {
   try {
      await app.listen({ port: env.PORT, host: '0.0.0.0' });
   } catch (err) {
      app.log.error(err);
      process.exit(1);
   }
};

start();
