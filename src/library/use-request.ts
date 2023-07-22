import { FastifyRequest } from 'fastify';
import { container } from '../container.js';

export const useRequest = (): FastifyRequest => {
  return container.current!.getSync('request');
};
