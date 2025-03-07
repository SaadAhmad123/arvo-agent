import type { ArvoContract, ArvoSemanticVersion } from 'arvo-core';
import type { OrchestrationInitEventBaseSchema } from 'arvo-core/dist/ArvoOrchestratorContract/schema';
import type { z } from 'zod';
import type { ArvoAgentEventTypeGen } from '../../typegen';

export type ArvoAgentContractVersionRecord = Record<
  ArvoSemanticVersion,
  {
    // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
    init: z.ZodObject<any, any, any>;
    // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
    complete: z.ZodObject<any, any, any>;
  }
>;

export type ArvoAgentContract<
  TUri extends string = string,
  TName extends string = string,
  TVersions extends ArvoAgentContractVersionRecord = ArvoAgentContractVersionRecord,
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TMetaData extends Record<string, any> = Record<string, any>,
> = ArvoContract<
  TUri,
  ReturnType<typeof ArvoAgentEventTypeGen.agent.init<TName>>,
  {
    [V in ArvoSemanticVersion & keyof TVersions]: {
      accepts: ReturnType<
        typeof OrchestrationInitEventBaseSchema.merge<TVersions[V]['init'], TVersions[V]['init']['shape']>
      >;
      emits: {
        [K in ReturnType<typeof ArvoAgentEventTypeGen.agent.complete<TName>>]: TVersions[V]['complete'];
      };
    };
  },
  TMetaData & {
    contractType: 'ArvoAgentContract';
    rootType: TName;
    initEventType: ReturnType<typeof ArvoAgentEventTypeGen.agent.init<TName>>;
    completeEventType: ReturnType<typeof ArvoAgentEventTypeGen.agent.complete<TName>>;
    versions: TVersions;
  }
>;
