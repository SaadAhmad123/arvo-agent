import { ArvoAgentToolsetHandler } from './index';
import type { ArvoAgentToolsetContract } from '../../contracts';
import type { IArvoAgentToolsetHandler } from './types';

/**
 * Creates a new ArvoAgentToolsetHandler instance with a simplified factory pattern.
 * The handler can be created using either the Tool Handler or Event Handler pattern:
 *
 * @example Tool Handler Pattern - Direct tool implementation with type safety
 * ```typescript
 * const documentHandler = createArvoAgentToolsetHandler({
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
 * @example Event Handler Pattern - Custom event processing
 * ```typescript
 * const documentHandler = createArvoAgentToolsetHandler({
 *   contract: documentContract,
 *   executionunits: 1,
 *   handler: {
 *     "1.0.0": async ({ event }) => {
 *       // Custom routing and processing
 *       return processDocumentEvent(event);
 *     }
 *   }
 * });
 * ```
 *
 * @template TContract - The toolset contract type that defines the tools' interfaces
 * @param param - Configuration object for the handler including contract,
 *                implementation, execution units, and optional monitoring settings
 * @returns A new instance of ArvoAgentToolsetHandler configured with the provided parameters
 */
export const createArvoAgentToolsetHandler = <TContract extends ArvoAgentToolsetContract>(
  param: IArvoAgentToolsetHandler<TContract>,
) => new ArvoAgentToolsetHandler<TContract>(param);
