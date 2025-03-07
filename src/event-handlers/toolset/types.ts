import type { Span, SpanOptions } from '@opentelemetry/api';
import type { ArvoSemanticVersion, InferVersionedArvoContract, VersionedArvoContract } from 'arvo-core';
import type { ArvoEventHandlerFunction } from 'arvo-event-handler';
import type { z } from 'zod';
import type { ArvoAgentToolsetContract } from '../../contracts';

/**
 * Defines the structure of a handler for Agentic tools within a toolset.
 * This type ensures that each tool in the toolset has a corresponding handler
 * that respects the contract's type definitions and versioning.
 *
 * @template TContract - The toolset contract type that defines the tools' interfaces
 *
 * @example
 * ```typescript
 * const documentHandler: ArvoAgentToolHandler<DocumentToolsContract> = {
 *   "1.0.0": {
 *     extract: async ({ data }) => {
 *       const text = await processDocument(data);
 *       return { text };
 *     },
 *     summarize: async ({ data }) => {
 *       const summary = await generateSummary(data);
 *       return { summary, __executionunits: 1 };
 *     }
 *   }
 * };
 * ```
 */
export type ArvoAgentToolHandlerMap<TContract extends ArvoAgentToolsetContract> = {
  [V in ArvoSemanticVersion & keyof TContract['versions']]: {
    [T in keyof z.infer<TContract['versions'][V]['accepts']> & string]: (param: {
      /** The input data for this specific tool */
      data: NonNullable<z.infer<TContract['versions'][V]['accepts']>[T]>;
      /** The complete event object */
      event: InferVersionedArvoContract<VersionedArvoContract<TContract, V>>['accepts'];
      /** The opentelemetry span */
      span: Span;
    }) => Promise<
      NonNullable<z.infer<TContract['versions'][V]['emits'][TContract['metadata']['completeEventType']]>[T]> & {
        /** Optional execution cost for this specific tool invocation */
        __executionunits?: number;
      }
    >;
  };
};

/**
 * Interface for a toolset handler that implements an Agentic toolset contract.
 */
export interface IArvoAgentToolset<TContract extends ArvoAgentToolsetContract> {
  /**
   * The contract for the handler defining its input and outputs as well as the description.
   */
  contract: TContract;

  /**
   * The base execution cost of the handler. Any additional tool specific cost
   * can be returned in the tool `__executionunits` field and it will
   * be accumulated.
   */
  executionunits: number;

  /**
   * The handler implementation for processing tools within this toolset.
   * Supports two implementation patterns, each with different trade-offs:
   *
   * 1. Event Handler Pattern (ArvoEventHandlerFunction):
   * - Provides complete control over event processing
   * - Allows custom event routing and handling logic
   * - Requires manual handling of tool dispatch
   * - No automatic type checking for tool implementation completeness
   *
   * @example
   * ```typescript
   * handler: {
   *   "1.0.0": async ({ event }) => {
   *     // Custom routing and processing
   *     switch(event.data.tool) {
   *       case 'summarize':
   *         return { type: 'arvo.agent.toolset.<tool name>.done', data: await summarize(event.data) };
   *     }
   *   }
   * }
   * ```
   *
   * 2. Tool Handler Pattern (ArvoAgentToolHandler):
   * - Type-safe implementation of tools
   * - Compiler ensures all tools are implemented
   * - Automatic tool routing and event generation
   * - Simplified tool-focused development
   *
   * @example
   * ```typescript
   * handler: {
   *   "1.0.0": {
   *     summarize: async ({ data }) => {
   *       return {
   *          ...(await summarize(data)),
   *          __executionunits: 2
   *       };
   *     },
   *     classify: async ({ data }) => {
   *       return await classify(data);
   *     }
   *   }
   * }
   * ```
   *
   * Choose the pattern based on your needs:
   * - Use Tool Handler for standard tool implementations with strong type safety
   * - Use Event Handler when you need custom event handling or complex routing logic
   */
  handler: ArvoEventHandlerFunction<TContract> | ArvoAgentToolHandlerMap<TContract>;

  /**
   * The OpenTelemetry span options
   */
  spanOptions?: SpanOptions;
}
