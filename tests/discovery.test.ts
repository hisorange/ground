import { FastifyInstance } from 'fastify';
import { join } from 'path';
import { createApx, useProvider } from '../src/index.js';

describe('Discovery', () => {
  it('should be able to discover the "test" provider', async () => {
    const root = join(__dirname, 'fixtures', 'discovery-01');
    const ctx = await createApx(root);

    expect(ctx).toBeDefined();
    expect(
      ctx.container.findByTag('provider').map(binding => binding.key),
    ).toContain('test');

    await ctx.run(async () => {
      const testValue = await useProvider<string>('test');

      expect(testValue).toBe('test-value');
    });
  });

  it('should be able to discover the "hello" route', async () => {
    const root = join(__dirname, 'fixtures', 'discovery-01');
    const apx = await createApx(root);

    expect(apx).toBeDefined();

    await apx.run(async () => {
      const server = await useProvider<FastifyInstance>('server');

      await server.ready();

      // Fake a get "hello" request
      const response = await server.inject({
        method: 'GET',
        url: '/hello',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('hello');
    });
  });
});
