import type { ArvoEvent, ArvoSemanticVersion, ViolationError } from 'arvo-core';
import { ArvoEventHandler, type ArvoEventHandlerFunction } from 'arvo-event-handler';
import type { ArvoMcpToolsetContract } from '../../contracts';
import type { IArvoMcpToolsetHandler, ArvoMcpToolHandlerMap } from './types';
import type { Span } from '@opentelemetry/api';

function getEventHandler<TContract extends ArvoMcpToolsetContract>(
  contract: TContract,
  handler: IArvoMcpToolsetHandler<TContract>['handler'],
  defaultExecutionUnits: number,
): ArvoEventHandlerFunction<TContract> {
  // Check if we have any versions
  const firstVersion = Object.keys(handler)[0] as ArvoSemanticVersion | undefined;
  if (!firstVersion) {
    throw Error(`Contract ${contract.uri} requires handler implementation of at least 1 version`);
  }

  // If it's already an event handler, return as is
  if (typeof handler[firstVersion] === 'function') {
    return handler as ArvoEventHandlerFunction<TContract>;
  }

  // Convert tool handler to event handler
  return Object.fromEntries(
    Object.entries(handler as ArvoMcpToolHandlerMap<TContract>).map(([version, tools]) => [
      version,
      async ({ event, span }: { event: ArvoEvent; span: Span }) => {
        const availableTools = Object.keys(tools);
        const requestedTools = Object.keys(event.data);

        // Execute all requested tools in parallel
        const results = await Promise.all(
          requestedTools.map(async (toolName) => {
            try {
              // Check if tool exists
              if (!availableTools.includes(toolName)) {
                throw new Error(`Tool '${toolName}' not found. Available tools: ${availableTools.join(', ')}`);
              }

              // Get tool implementation
              const tool = tools[toolName];
              if (!event.data[toolName]) {
                return [toolName, null];
              }

              // Execute tool
              const result = await tool({
                data: event.data[toolName],
                event,
                span,
              });

              return [
                toolName,
                {
                  ...result,
                  __executionunits: result.__executionunits ?? defaultExecutionUnits,
                },
              ];
            } catch (error) {
              if ((error as ViolationError).name.includes('ViolationError')) {
                throw error;
              }
              throw new Error(`Tool '${toolName}' execution failure: ${(error as Error).message}`);
            }
          }),
        );

        // Calculate total execution units
        const executionunits = results.reduce((total, [_, result]) => total + (result?.__executionunits ?? 0), 0);

        // Return results
        return {
          type: contract.metadata.completeEventType,
          data: Object.fromEntries(results),
          executionunits,
        };
      },
    ]),
  ) as unknown as ArvoEventHandlerFunction<TContract>;
}

/**
 * ArvoMcpToolsetHandler manages the execution of MCP-compliant tools within Arvo's event-driven architecture.
 *
 * The handler supports two implementation patterns:
 * 1. Event Handler: Full control over event processing with manual tool routing
 * 2. Tool Handler: Direct tool implementation with automatic routing and type safety
 *
 * @example Using Tool Handler pattern:
 * ```typescript
 * const documentHandler = createArvoMcpToolsetHandler({
 *   contract: documentContract,
 *   executionunits: 1,
 *   handler: {
 *     "1.0.0": {
 *       extractText: async ({ data }) => {
 *         return { text: await processDocument(data) };
 *       },
 *       summarize: async ({ data }) => {
 *         return { summary: await generateSummary(data) };
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @example Using Event Handler pattern:
 * ```typescript
 * const documentHandler = createArvoMcpToolsetHandler({
 *   contract: documentContract,
 *   executionunits: 1,
 *   handler: {
 *     "1.0.0": async ({ event }) => {
 *       // Custom routing logic
 *       return handleDocumentEvent(event);
 *     }
 *   }
 * });
 * ```
 */
export class ArvoMcpToolsetHandler<TContract extends ArvoMcpToolsetContract> extends ArvoEventHandler<TContract> {
  constructor({ contract, handler, executionunits, spanOptions }: IArvoMcpToolsetHandler<TContract>) {
    super({
      contract: contract,
      executionunits: executionunits,
      spanOptions: spanOptions,
      handler: getEventHandler(contract, handler, executionunits),
    });
  }
}
