import { type ArvoContract, type ArvoSemanticVersion } from 'arvo-core';
import { z } from 'zod';
import { ArvoMcpEventTypeGen } from '../../typegen';

/**
 * Defines the structure of tool collections within a service boundary.
 * Each version of a service can expose multiple tools that work together
 * to provide a cohesive set of capabilities.
 *
 * For example, a document processing service might expose tools for:
 * - Text extraction
 * - Summarization
 * - Classification
 *
 * These tools, while independent, share a common service context and can
 * be versioned together as the service evolves.
 */
export type ArvoMcpToolsetContractVersionRecord = Record<
  ArvoSemanticVersion,
  {
    tools: Record<
      string,
      {
        description: string;
        accepts: z.ZodTypeAny;
        emits: z.ZodTypeAny;
      }
    >;
  }
>;

/**
 * A toolset contract that defines a service boundary containing multiple
 * related tools. This contract ensures type safety and MCP compliance
 * while allowing the service to evolve over time.
 */
export type ArvoMcpToolsetContract<
  TUri extends string = string,
  TName extends string = string,
  TVersions extends ArvoMcpToolsetContractVersionRecord = ArvoMcpToolsetContractVersionRecord,
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TMetaData extends Record<string, any> = Record<string, any>,
> = ArvoContract<
  TUri,
  ReturnType<typeof ArvoMcpEventTypeGen.tools.init<TName>>,
  {
    [V in ArvoSemanticVersion & keyof TVersions]: {
      accepts: z.ZodObject<{
        [K in keyof TVersions[V]['tools']]: z.ZodOptional<TVersions[V]['tools'][K]['accepts']>;
      }>;
      emits: {
        [K in ReturnType<typeof ArvoMcpEventTypeGen.tools.complete<TName>>]: z.ZodObject<{
          [T in keyof TVersions[V]['tools']]: z.ZodOptional<TVersions[V]['tools'][T]['emits']>;
        }>;
      };
    };
  },
  TMetaData & {
    contractType: 'ArvoMcpToolContract';
    rootType: TName;
    initEventType: ReturnType<typeof ArvoMcpEventTypeGen.tools.init<TName>>;
    completeEventType: ReturnType<typeof ArvoMcpEventTypeGen.tools.complete<TName>>;
    versions: TVersions;
  }
>;
