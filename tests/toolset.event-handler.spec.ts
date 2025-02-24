import { z } from 'zod';
import { createArvoMcpToolsetContract, createArvoMcpToolsetHandler } from '../src';
import { createArvoEventFactory } from 'arvo-core';
import { ExecutionViolation } from 'arvo-event-handler';

describe('ArvoMcpToolsetHandler', () => {
  const testContract = createArvoMcpToolsetContract({
    uri: '#/mcp/test/contract',
    name: 'test.tools',
    versions: {
      '1.0.0': {
        add: {
          description: 'Adds two numbers',
          accepts: z.object({ a: z.number(), b: z.number() }),
          emits: z.object({ sum: z.number() }),
        },
        multiply: {
          description: 'Multiplies two numbers',
          accepts: z.object({ a: z.number(), b: z.number() }),
          emits: z.object({ product: z.number() }),
        },
      },
    },
  });

  describe('Tool Handler Pattern', () => {
    const handler = createArvoMcpToolsetHandler({
      contract: testContract,
      executionunits: 1,
      handler: {
        '1.0.0': {
          add: async ({ data }) => ({
            sum: data.a + data.b,
          }),
          multiply: async ({ data }) => ({
            product: data.a * data.b,
            __executionunits: 2,
          }),
        },
      },
    });

    it('should process single tool request', async () => {
      const event = createArvoEventFactory(testContract.version('1.0.0')).accepts({
        source: 'com.test.test',
        data: {
          add: { a: 2, b: 3 },
        },
      });

      const result = await handler.execute(event);
      expect(result[0].data).toEqual({
        add: { sum: 5 },
      });
      expect(result[0].executionunits).toBe(1);
    });

    it('should process multiple tool requests', async () => {
      const event = createArvoEventFactory(testContract.version('1.0.0')).accepts({
        source: 'com.test.test',
        data: {
          add: { a: 2, b: 3 },
          multiply: { a: 4, b: 5 },
        },
      });

      const result = await handler.execute(event);
      expect(result[0].data).toEqual({
        add: { sum: 5 },
        multiply: { product: 20 },
      });
      expect(result[0].executionunits).toBe(3);
    });

    it('should handle errors in any individual tools', async () => {
      const handler = createArvoMcpToolsetHandler({
        contract: testContract,
        executionunits: 1,
        handler: {
          '1.0.0': {
            add: async () => {
              throw new Error('Add failed');
            },
            multiply: async ({ data }) => ({
              product: data.a * data.b,
            }),
          },
        },
      });

      const event = createArvoEventFactory(testContract.version('1.0.0')).accepts({
        source: 'com.test.test',
        data: {
          add: { a: 2, b: 3 },
          multiply: { a: 4, b: 5 },
        },
      });

      const result = await handler.execute(event);
      expect(result[0].type).toBe('sys.arvo.mcp.tools.test.tools.error');
      expect(result[0].data.errorMessage).toBe("Tool 'add' execution failure: Add failed");
    });

    it('should handle passthrough the violation errors in any individual tools', async () => {
      const handler = createArvoMcpToolsetHandler({
        contract: testContract,
        executionunits: 1,
        handler: {
          '1.0.0': {
            add: async () => {
              throw new ExecutionViolation('Add failed');
            },
            multiply: async ({ data }) => ({
              product: data.a * data.b,
            }),
          },
        },
      });

      const event = createArvoEventFactory(testContract.version('1.0.0')).accepts({
        source: 'com.test.test',
        data: {
          add: { a: 2, b: 3 },
          multiply: { a: 4, b: 5 },
        },
      });

      await expect(() => handler.execute(event)).rejects.toThrow('ViolationError<Execution> Add failed');
    });
  });
});
