import { Logger } from 'pino';
import { useProvider } from './use-provider.js';

export const useLogger = async (name?: string) =>
  name
    ? (await useProvider<Logger>('logger')).child({ name })
    : await useProvider<Logger>('logger');
