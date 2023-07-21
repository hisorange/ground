import { join } from 'path';
import { createApx, useProvider } from '../src/index.js';

describe('Discovery', () => {
  it('should be able to discover the Test provider', async () => {
    const root = join(__dirname, 'fixtures', 'discovery-01');
    const ctx = await createApx(root);

    expect(ctx).toBeDefined();
    expect(
      ctx.container.findByTag('provider').map(binding => binding.key),
    ).toEqual(['logger', 'test']);

    await ctx.run(async () => {
      const testValue = await useProvider<string>('test');

      expect(testValue).toBe('test-value');
    });
  });
});
