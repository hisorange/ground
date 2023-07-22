import { randomUUID } from 'crypto';
import fastify from 'fastify';
import { useLogger } from '../index.js';

export default async () => {
  const logger = await useLogger();
  const server = fastify({
    logger,
    genReqId: () => randomUUID(),
  });

  return server;
};
