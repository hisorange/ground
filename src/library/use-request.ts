import { FastifyRequest } from 'fastify';
import { IoC } from '../container.js';

export const useRequest = (): FastifyRequest => {
  const store = IoC.request.getStore();

  if (!store) {
    throw new Error('useRequest cannot be used outside of a request context');
  }

  return store.getSync('request');
};
