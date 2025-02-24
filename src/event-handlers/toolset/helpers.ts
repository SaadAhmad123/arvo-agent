import { ArvoMcpToolsetHandler } from './index';
import type { ArvoMcpToolsetContract } from '../../contracts';
import type { IArvoMcpToolsetHandler } from './types';

/**
 * Creates a new ArvoMcpToolsetHandler instance with a simplified factory pattern.
 * This factory function provides a convenient way to create toolset handlers
 * that can operate in both Arvo's event-driven system and MCP environments.
 *
 * The handler can be created using either the Tool Handler or Event Handler pattern:
 *
 * @example Tool Handler Pattern - Direct tool implementation with type safety
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
 * @example Event Handler Pattern - Custom event processing
 * ```typescript
 * const documentHandler = createArvoMcpToolsetHandler({
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
 * @returns A new instance of ArvoMcpToolsetHandler configured with the provided parameters
 */
export const createArvoMcpToolsetHandler = <TContract extends ArvoMcpToolsetContract>(
  param: IArvoMcpToolsetHandler<TContract>,
) => new ArvoMcpToolsetHandler<TContract>(param);
