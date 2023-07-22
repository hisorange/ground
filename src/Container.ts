import { Context as ContextProvider } from '@loopback/context';
import { AsyncLocalStorage } from 'node:async_hooks';

export const IoC: {
  current: ContextProvider | null;
  request: AsyncLocalStorage<ContextProvider>;
} = {
  current: null,
  request: new AsyncLocalStorage(),
};
