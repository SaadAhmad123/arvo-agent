import { createArvoEventFactory } from 'arvo-core';
import { z } from 'zod';
import { createArvoAgentContract } from '../src/index';

describe('ArvoAgentContract', () => {
  const createTestContract = () =>
    createArvoAgentContract({
      uri: '#/agent/test',
      name: 'policy.rag',
      versions: {
        '1.0.0': {
          init: z.object({ message: z.string() }),
          complete: z.object({ reply: z.string() }),
        },
      },
    });

  it('should define the agent contract', () => {
    const testContract = createTestContract();
    expect(testContract.metadata.contractType).toBe('ArvoAgentContract');
    expect(testContract.version('1.0.0').dataschema).toBe('#/agent/test/1.0.0');
    expect(testContract.version('1.0.0').accepts.type).toBe('arvo.agent.policy.rag');
    expect(Object.keys(testContract.version('1.0.0').emits)[0]).toBe('arvo.agent.policy.rag.done');
  });

  it('should successfully create the partial agent event', () => {
    const testContract = createTestContract();
    const toolEvent = createArvoEventFactory(testContract.version('1.0.0')).accepts({
      source: 'com.test.test',
      data: {
        parentSubject$$: null,
        message: 'Hello',
      },
    });

    expect(toolEvent.type).toBe('arvo.agent.policy.rag');
    expect(toolEvent.dataschema).toBe('#/agent/test/1.0.0');
    expect(toolEvent.data.parentSubject$$).toBe(null);
    expect(toolEvent.data.message).toBe('Hello');
  });
});
