import { BindingAddress, Context } from '@loopback/context';
import { basename, join } from 'path';
import walkdir from 'walkdir';
import { container } from './container.js';
import LoggerProvider from './providers/logger.provider.js';

export const createApx = async (root: string) => {
  const context = new Context('apx');

  const createBinding = async (
    address: BindingAddress<unknown>,
    resolver: () => unknown,
    tag: string,
  ) => {
    container.current = context;
    context
      .bind(address)
      .to(await resolver())
      .tag(tag);
    container.current = null;
  };

  await createBinding('logger', LoggerProvider, 'provider');

  for await (const entry of await walkdir.async(join(root, 'providers'))) {
    const provider = await import(entry);
    const name = basename(entry)
      .replace(/\.js$|\.ts$/i, '')
      .replace(/\.provider$/i, '');

    if (provider.default === undefined) {
      throw new Error(`Provider "${name}" does not export a default export`);
    }

    await createBinding(name, provider.default, 'provider');
  }

  return {
    run: async <T>(fn: () => Promise<T>) => {
      container.current = context;
      const result = await fn();
      container.current = null;
      return result;
    },
    container: context,
  };
};
