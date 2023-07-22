import {
  Binding,
  BindingAddress,
  BindingType,
  Context,
} from '@loopback/context';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { basename, join } from 'path';
import { Logger } from 'pino';
import { async as walkDir } from 'walkdir';
import { IoC } from './container.js';
import LoggerProvider from './providers/logger.provider.js';
import ServerProvider from './providers/server.provider.js';

const bindTo = async (
  ctx: Context,
  addr: BindingAddress<unknown>,
  resolver: () => Promise<unknown>,
  tag?: string,
) => {
  try {
    IoC.current = ctx;
    const value = await resolver();
    const binding = ctx.bind(addr);

    tag && binding.tag(tag);

    binding['_source'] = {
      type: BindingType.CONSTANT,
      value,
    };

    binding['_setValueGetter']((resolutionCtx: Context) => {
      return Binding['valueOrProxy'](resolutionCtx, value);
    });
  } finally {
    IoC.current = null;
  }
};

const bindSyncTo = (
  inContext: Context,
  address: BindingAddress<unknown>,
  resolver: () => unknown,
  tag?: string,
) => {
  try {
    IoC.current = inContext;
    const value = resolver();
    const binding = inContext.bind(address);

    tag && binding.tag(tag);

    binding['_source'] = {
      type: BindingType.CONSTANT,
      value,
    };

    binding['_setValueGetter']((resolutionCtx: Context) => {
      return Binding['valueOrProxy'](resolutionCtx, value);
    });
  } finally {
    IoC.current = null;
  }
};

const registerProviders = async (root: string, ctx: Context) => {
  for await (const entry of await walkDir(join(root, 'providers'))) {
    const provider = (await import(entry))?.default;
    const key = basename(entry)
      .replace(/\.js$|\.ts$/i, '')
      .replace(/\.provider$/i, '');

    if (provider === undefined) {
      throw new Error(`Provider "${key}" does not export a default export`);
    }

    await bindTo(ctx, key, provider, 'provider');
  }
};

const registerRoutes = async (pathRoot: string, ctxRoot: Context) => {
  const httpServer = await ctxRoot.get<FastifyInstance>('server');
  const logger = await ctxRoot.get<Logger>('logger');

  for await (const entry of await walkDir(join(pathRoot, 'routes'))) {
    const handlers = await import(entry);
    const path = entry
      .replace(join(pathRoot, 'routes'), '')
      .replace(/\.js$|\.ts$/i, '')
      .replace(/^\//, '');

    if (handlers.GET && typeof handlers.GET === 'function') {
      logger.info(`Registering route [GET] "${path}"`);

      const handler = async (
        inRequest: FastifyRequest,
        inReply: FastifyReply,
      ) => {
        const ctxRequest = new Context(ctxRoot);

        bindSyncTo(ctxRequest, 'request', () => inRequest);
        bindSyncTo(ctxRequest, 'reply', () => inReply);

        let response: unknown;

        try {
          response = await IoC.request.run(ctxRequest, handlers.GET);
        } finally {
          ctxRequest.close();
        }

        return response;
      };

      httpServer.get(`/${path}`, handler);
    }
  }
};

export const createApx = async (pathRoot: string) => {
  const ctxRoot = new Context('apx');

  await bindTo(ctxRoot, 'logger', LoggerProvider, 'provider');
  await bindTo(ctxRoot, 'server', ServerProvider, 'provider');

  await Promise.all([
    registerProviders(pathRoot, ctxRoot),
    registerRoutes(pathRoot, ctxRoot),
  ]);

  return {
    run: async <T>(fn: () => Promise<T>) => {
      IoC.current = ctxRoot;
      const result = await fn();
      IoC.current = null;
      return result;
    },
    context: ctxRoot,
  };
};
