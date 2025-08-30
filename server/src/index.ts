import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

app.get('/health', async () => ({ ok: true }));

const start = async () => {
   try {
      await app.listen({ port: env.PORT, host: '0.0.0.0' });
   } catch (err) {
      app.log.error(err);
      process.exit(1);
   }
};

start();
