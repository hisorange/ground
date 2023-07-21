import { pino } from 'pino';

export default function LoggerProvider() {
  return pino({
    name: 'ground',
  });
}
