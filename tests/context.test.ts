import { join } from 'path';
import { Logger } from 'pino';
import { createApx, useLogger, useProvider } from '../src/index.js';

describe('Context', () => {
  it('should be throw when context is not created', () => {
    expect(() => useProvider('logger')).toThrowError('Context is not created');
  });

  it('should be able to use the Logger', async () => {
    const ctx = await createApx(join(__dirname, 'fixtures', 'discovery-01'));

    ctx.run(async () => {
      const logger = await useProvider<Logger>('logger');
      expect(logger).toBeDefined();
      expect(logger.child).toBeDefined();
    });
  });

  it('should be able to use the useLogger', async () => {
    const apx = await createApx(join(__dirname, 'fixtures', 'discovery-01'));

    apx.run(async () => {
      const logger = await useLogger();
      expect(logger).toBeDefined();
      expect(logger.child).toBeDefined();
    });

    apx.run(async () => {
      const logger = await useLogger('myScope');
      expect(logger).toBeDefined();
      expect(logger.child).toBeDefined();
    });
  });
});
