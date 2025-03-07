import { ArvoEventHandler } from 'arvo-event-handler';
import type { ArvoAgentToolsetContract } from '../../contracts';
import { getToolMapHandler } from './toolMapHandler';
import type { IArvoAgentToolset } from './types';

/**
 * ArvoAgentToolset manages the execution of tools used by an agent within Arvo's event-driven architecture.
 *
 * @example Using Tool Handler pattern:
 * ```typescript
 * const documentHandler = createArvoAgentToolset({
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
 * const documentHandler = createArvoAgentToolset({
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
export class ArvoAgentToolset<TContract extends ArvoAgentToolsetContract> extends ArvoEventHandler<TContract> {
  constructor({ contract, handler, executionunits, spanOptions }: IArvoAgentToolset<TContract>) {
    super({
      contract: contract,
      executionunits: executionunits,
      spanOptions: spanOptions,
      handler: getToolMapHandler(contract, handler, executionunits),
    });
  }
}
