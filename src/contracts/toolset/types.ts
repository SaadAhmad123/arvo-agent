import type { ArvoContract, ArvoSemanticVersion } from 'arvo-core';
import type { z } from 'zod';
import type { ArvoAgentEventTypeGen } from '../../typegen';

/**
 * Defines the structure of tool collections within a service boundary.
 * Each version of a service can expose multiple tools that work together
 * to provide a cohesive set of capabilities.
 *
 * These tools, while independent, share a common service context and can
 * be versioned together as the service evolves.
 */
export type ArvoAgentToolsetContractVersionRecord = Record<
  ArvoSemanticVersion,
  Record<
    string,
    {
      description: string;
      accepts: z.ZodTypeAny;
      emits: z.ZodTypeAny;
    }
  >
>;

/**
 * A toolset contract that defines a service boundary containing multiple
 * related tools.
 */
export type ArvoAgentToolsetContract<
  TUri extends string = string,
  TName extends string = string,
  TVersions extends ArvoAgentToolsetContractVersionRecord = ArvoAgentToolsetContractVersionRecord,
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TMetaData extends Record<string, any> = Record<string, any>,
> = ArvoContract<
  TUri,
  ReturnType<typeof ArvoAgentEventTypeGen.toolset.init<TName>>,
  {
    [V in ArvoSemanticVersion & keyof TVersions]: {
      accepts: z.ZodObject<{
        [K in keyof TVersions[V]]: z.ZodOptional<TVersions[V][K]['accepts']>;
      }>;
      emits: {
        [K in ReturnType<typeof ArvoAgentEventTypeGen.toolset.complete<TName>>]: z.ZodObject<{
          [T in keyof TVersions[V]]: z.ZodOptional<TVersions[V][T]['emits']>;
        }>;
      };
    };
  },
  TMetaData & {
    contractType: 'ArvoAgentToolContract';
    rootType: TName;
    initEventType: ReturnType<typeof ArvoAgentEventTypeGen.toolset.init<TName>>;
    completeEventType: ReturnType<typeof ArvoAgentEventTypeGen.toolset.complete<TName>>;
    versions: TVersions;
  }
>;
