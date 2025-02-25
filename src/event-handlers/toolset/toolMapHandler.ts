import type { ArvoEvent, ArvoSemanticVersion, ViolationError } from 'arvo-core';
import type { ArvoEventHandlerFunction } from 'arvo-event-handler';
import type { ArvoAgentToolsetContract } from '../../contracts';
import type { IArvoAgentToolsetHandler, ArvoAgentToolHandlerMap } from './types';
import type { Span } from '@opentelemetry/api';

export const getToolMapHandler = <TContract extends ArvoAgentToolsetContract>(
  contract: TContract,
  handler: IArvoAgentToolsetHandler<TContract>['handler'],
  baseExecutionUnits: number,
): ArvoEventHandlerFunction<TContract> => {
  const firstVersion = Object.keys(handler)[0] as ArvoSemanticVersion | undefined;
  if (!firstVersion) {
    throw Error(`Contract ${contract.uri} requires handler implementation of at least 1 version`);
  }

  if (typeof handler[firstVersion] === 'function') {
    return handler as ArvoEventHandlerFunction<TContract>;
  }

  return Object.fromEntries(
    Object.entries(handler as ArvoAgentToolHandlerMap<TContract>).map(([version, tools]) => [
      version,
      async ({ event, span }: { event: ArvoEvent; span: Span }) => {
        const availableTools = Object.keys(tools);
        const requestedTools = Object.keys(event.data);

        // Execute all requested tools in parallel
        let results = await Promise.all(
          requestedTools.map(async (toolName) => {
            try {
              if (!availableTools.includes(toolName)) {
                throw new Error(`Tool '${toolName}' not found. Available tools: ${availableTools.join(', ')}`);
              }

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

              return [toolName, result];
            } catch (error) {
              if ((error as ViolationError).name.includes('ViolationError')) {
                throw error;
              }
              throw new Error(`Tool '${toolName}' execution failure: ${(error as Error).message}`);
            }
          }),
        );

        results = results.filter((item) => Boolean(item[1]));

        const executionunits = results.length
          ? results.reduce((total, [_, result]) => total + (result?.__executionunits ?? 0), baseExecutionUnits)
          : baseExecutionUnits;

        return {
          type: contract.metadata.completeEventType,
          data: Object.fromEntries(results),
          executionunits,
        };
      },
    ]),
  ) as unknown as ArvoEventHandlerFunction<TContract>;
};
