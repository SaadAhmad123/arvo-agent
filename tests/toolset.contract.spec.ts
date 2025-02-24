import { createArvoEventFactory } from 'arvo-core';
import { z } from 'zod';
import { createArvoMcpToolsetContract } from '../src/index';
describe('ArvoMcpToolsetContract', () => {
  const createTestContract = () =>
    createArvoMcpToolsetContract({
      uri: '#/mcp/test/test',
      name: 'policy.rag',
      versions: {
        '1.0.0': {
          'get-weather': {
            description: 'Fetch latest weather for a given location in celcius',
            accepts: z.object({ location: z.string() }),
            emits: z.object({ temperature: z.number() }),
          },
          'celcius-to-kelvin': {
            description: 'Converts celcius temperature to kelvin',
            accepts: z.object({ celcius: z.number() }),
            emits: z.object({ kelvin: z.number() }),
          },
        },
      },
    });

  it('should define the toolset contract', () => {
    const testContract = createTestContract();
    expect(testContract.metadata.contractType).toBe('ArvoMcpToolsetContract');
    expect(testContract.version('1.0.0').dataschema).toBe('#/mcp/test/test/1.0.0');
    expect(testContract.version('1.0.0').accepts.type).toBe('arvo.mcp.tools.policy.rag');
  });

  it('should successfully create the partial tool event', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).accepts({
      source: 'com.test.test',
      data: {
        'get-weather': {
          location: 'Washington',
        },
      },
    });
    expect(toolEvent.type).toBe('arvo.mcp.tools.policy.rag');
    expect(toolEvent.dataschema).toBe('#/mcp/test/test/1.0.0');
    expect(toolEvent.data['get-weather']?.location).toBe('Washington');
    expect(toolEvent.data['celcius-to-kelvin']).not.toBeDefined();
  });

  it('should successfully create the empty tool event', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).accepts({
      source: 'com.test.test',
      data: {},
    });
    expect(toolEvent.type).toBe('arvo.mcp.tools.policy.rag');
    expect(toolEvent.dataschema).toBe('#/mcp/test/test/1.0.0');
    expect(toolEvent.data['get-weather']).not.toBeDefined();
    expect(toolEvent.data['celcius-to-kelvin']).not.toBeDefined();
  });

  it('should successfully create the exhastive tool event', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).accepts({
      source: 'com.test.test',
      data: {
        'get-weather': {
          location: 'Washington',
        },
        'celcius-to-kelvin': {
          celcius: 0,
        },
      },
    });
    expect(toolEvent.type).toBe('arvo.mcp.tools.policy.rag');
    expect(toolEvent.dataschema).toBe('#/mcp/test/test/1.0.0');
    expect(toolEvent.data['get-weather']?.location).toBe('Washington');
    expect(toolEvent.data['celcius-to-kelvin']?.celcius).toBe(0);
  });

  it('should successfully create the exhastive tool event and allow for other tools calls which will be ignored by the contract and the handler', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).accepts({
      source: 'com.test.test',
      data: {
        'get-weather': {
          location: 'Washington',
        },
        'celcius-to-kelvin': {
          celcius: 0,
        },
        'celcius-to-kelvin-1': {
          celcius: 1,
        },
        // biome-ignore lint/suspicious/noExplicitAny: Just testing
      } as any,
    });
    expect(toolEvent.type).toBe('arvo.mcp.tools.policy.rag');
    expect(toolEvent.dataschema).toBe('#/mcp/test/test/1.0.0');
    expect(toolEvent.data['get-weather']?.location).toBe('Washington');
    expect(toolEvent.data['celcius-to-kelvin']?.celcius).toBe(0);
    // @ts-ignore
    expect(toolEvent.data['celcius-to-kelvin-1']).toBeUndefined();
  });

  it('should create a partial complete emit event', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).emits({
      type: 'arvo.mcp.tools.policy.rag.done',
      source: 'com.test.test',
      data: {
        'get-weather': {
          temperature: 12,
        },
      },
    });
    expect(toolEvent.type).toBe('arvo.mcp.tools.policy.rag.done');
    expect(toolEvent.dataschema).toBe('#/mcp/test/test/1.0.0');
    expect(toolEvent.data['get-weather']?.temperature).toBe(12);
    expect(toolEvent.data['celcius-to-kelvin']?.kelvin).toBeUndefined();
  });

  it('should create a error event', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).systemError({
      source: 'com.test.test',
      error: new Error('Something went wrong'),
    });
    expect(toolEvent.type).toBe('sys.arvo.mcp.tools.policy.rag.error');
    expect(toolEvent.dataschema).toBe('#/mcp/test/test/0.0.0');
    expect(toolEvent.data.errorMessage).toBe('Something went wrong');
  });
});
