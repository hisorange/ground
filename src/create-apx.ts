import {
  Binding,
  BindingAddress,
  BindingType,
  Context,
} from '@loopback/context';
import { FastifyInstance } from 'fastify';
import { basename, join } from 'path';
import { Logger } from 'pino';
import walkdir from 'walkdir';
import { container } from './container.js';
import LoggerProvider from './providers/logger.provider.js';
import ServerProvider from './providers/server.provider.js';

const createBinding = async (
  inContext: Context,
  address: BindingAddress<unknown>,
  resolver: () => unknown,
  tag: string,
) => {
  try {
    container.current = inContext;
    const value = await resolver();
    const binding = inContext.bind(address);
    binding.tag(tag);

    binding['_source'] = {
      type: BindingType.CONSTANT,
      value,
    };
    binding['_setValueGetter'](resolutionCtx => {
      return Binding['valueOrProxy'](resolutionCtx, value);
    });
  } finally {
    container.current = null;
  }
};

const registerProviders = async (root: string, context: Context) => {
  for await (const entry of await walkdir.async(join(root, 'providers'))) {
    const provider = (await import(entry))?.default;
    const key = basename(entry)
      .replace(/\.js$|\.ts$/i, '')
      .replace(/\.provider$/i, '');

    if (provider === undefined) {
      throw new Error(`Provider "${key}" does not export a default export`);
    }

    await createBinding(context, key, provider, 'provider');
  }
};

const registerRoutes = async (root: string, context: Context) => {
  const httpServer = await context.get<FastifyInstance>('server');
  const logger = await context.get<Logger>('logger');

  for await (const entry of await walkdir.async(join(root, 'routes'))) {
    const handlers = await import(entry);
    const path = entry
      .replace(join(root, 'routes'), '')
      .replace(/\.js$|\.ts$/i, '')
      .replace(/^\//, '');

    if (handlers.GET && typeof handlers.GET === 'function') {
      logger.info(`Registering route [GET] "${path}"`);

      httpServer.get(`/${path}`, async (request, reply) => {
        container.current = new Context(context);

        await createBinding(
          container.current,
          'request',
          () => request,
          'request',
        );
        await createBinding(container.current, 'reply', () => reply, 'reply');

        const result = await handlers.GET();
        container.current.close();
        container.current = null;
        return result;
      });
    }
  }
};

export const createApx = async (root: string) => {
  const rootContext = new Context('apx');

  await Promise.all([
    createBinding(rootContext, 'logger', LoggerProvider, 'provider'),
    createBinding(rootContext, 'server', ServerProvider, 'provider'),
  ]);

  await Promise.all([
    registerProviders(root, rootContext),
    registerRoutes(root, rootContext),
  ]);

  return {
    run: async <T>(fn: () => Promise<T>) => {
      container.current = rootContext;
      const result = await fn();
      container.current = null;
      return result;
    },
    container: rootContext,
  };
};
