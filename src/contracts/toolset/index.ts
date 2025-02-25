import { createArvoContract } from 'arvo-core';
import { z } from 'zod';
import { ArvoAgentEventTypeGen } from '../../typegen';
import type { ArvoAgentToolsetContract, ArvoAgentToolsetContractVersionRecord } from './types';

/**
 * Creates a contract that defines a toolset - a collection of related tools that work together
 * as a cohesive service boundary.
 *
 * A toolset represents a logical grouping of capabilities that belong together. For example,
 * a document processing toolset might include tools for text extraction, summarization, and
 * classification. While each tool is independent, they share context and evolve together.
 *
 * @example
 * ```typescript
 * const documentTools = createArvoAgentToolsetContract({
 *   uri: "#/agent/tools/document/processing/",
 *   name: "document.processing", // -> type = arvo.agent.toolset.document.processing
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
export const createArvoAgentToolsetContract = <
  TUri extends string = string,
  TName extends string = string,
  TVersions extends ArvoAgentToolsetContractVersionRecord = ArvoAgentToolsetContractVersionRecord,
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
    type: ArvoAgentEventTypeGen.toolset.init(param.name),
    versions: Object.fromEntries(
      Object.entries(param.versions).map(([version, item]) => [
        version,
        {
          accepts: z
            .object(Object.fromEntries(Object.entries(item).map(([tool, { accepts }]) => [tool, accepts])))
            .partial(),
          emits: {
            [ArvoAgentEventTypeGen.toolset.complete(param.name)]: z
              .object(Object.fromEntries(Object.entries(item).map(([tool, { emits }]) => [tool, emits])))
              .partial(),
          },
        },
      ]),
    ),
    metadata: {
      ...(param.metadata ?? {}),
      contractType: 'ArvoAgentToolsetContract' as const,
      rootType: param.name,
      initEventType: ArvoAgentEventTypeGen.toolset.init(param.name),
      completeEventType: ArvoAgentEventTypeGen.toolset.complete(param.name),
      versions: param.versions,
    },
  }) as unknown as ArvoAgentToolsetContract<TUri, TName, TVersions, TMetaData>;
