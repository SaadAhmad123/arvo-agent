import { createArvoContract } from 'arvo-core';
import { z } from 'zod';
import { ArvoMcpEventTypeGen } from '../../typegen';
import type { ArvoMcpToolsetContract, ArvoMcpToolsetContractVersionRecord } from './types';

/**
 * Creates a contract that defines a toolset - a collection of related tools that work together
 * as a cohesive service boundary. The contract ensures these tools can operate both within
 * Arvo's event-driven architecture and in standard MCP environments.
 *
 * A toolset represents a logical grouping of capabilities that belong together. For example,
 * a document processing toolset might include tools for text extraction, summarization, and
 * classification. While each tool is independent, they share context and evolve together.
 *
 * The contract provides:
 * - Type-safe boundaries between services through Arvo's contract system
 * - MCP compliance for tool interactions, enabling use outside Arvo
 * - Version management for graceful service evolution
 * - Clean separation between business logic and infrastructure
 *
 * @example
 * ```typescript
 * const documentTools = createArvoMcpToolsetContract({
 *   uri: "#/mcp/tools/document/processing/",
 *   name: "document.processing", // -> type = arvo.mcp.tools.document.processing
 *   versions: {
 *     "1.0.0": {
 *         extract: {
 *           description: "Extracts text from documents",
 *           accepts: z.object({ document: z.string() }),
 *           emits: z.object({ text: z.string() })
 *         },
 *         summarize: {
 *           description: "Generates document summary",
 *           accepts: z.object({ text: z.string() }),
 *           emits: z.object({ summary: z.string() })
 *         }
 *     }
 *   }
 * });
 * ```
 *
 * @returns A contract that defines the toolset's interface and behavior
 */
export const createArvoMcpToolsetContract = <
  TUri extends string = string,
  TName extends string = string,
  TVersions extends ArvoMcpToolsetContractVersionRecord = ArvoMcpToolsetContractVersionRecord,
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TMetaData extends Record<string, any> = Record<string, any>,
>(param: {
  uri: TUri;
  name: TName;
  versions: TVersions;
  metadata?: TMetaData;
}) =>
  createArvoContract({
    uri: param.uri,
    type: ArvoMcpEventTypeGen.tools.init(param.name),
    versions: Object.fromEntries(
      Object.entries(param.versions).map(([version, item]) => [
        version,
        {
          accepts: z
            .object(Object.fromEntries(Object.entries(item).map(([tool, { accepts }]) => [tool, accepts])))
            .partial(),
          emits: {
            [ArvoMcpEventTypeGen.tools.complete(param.name)]: z
              .object(Object.fromEntries(Object.entries(item).map(([tool, { emits }]) => [tool, emits])))
              .partial(),
          },
        },
      ]),
    ),
    metadata: {
      ...(param.metadata ?? {}),
      contractType: 'ArvoMcpToolsetContract' as const,
      rootType: param.name,
      initEventType: ArvoMcpEventTypeGen.tools.init(param.name),
      completeEventType: ArvoMcpEventTypeGen.tools.complete(param.name),
      versions: param.versions,
    },
  }) as unknown as ArvoMcpToolsetContract<TUri, TName, TVersions, TMetaData>;
