import { createArvoContract } from 'arvo-core';
import { OrchestrationInitEventBaseSchema } from 'arvo-core/dist/ArvoOrchestratorContract/schema';
import { isLowerAlphanumeric } from 'arvo-event-handler/dist/utils';
import { ArvoAgentEventTypeGen } from '../../typegen';
import type { ArvoAgentContract, ArvoAgentContractVersionRecord } from './types';

export const createArvoAgentContract = <
  TUri extends string,
  TName extends string,
  TVersions extends ArvoAgentContractVersionRecord,
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TMetaData extends Record<string, any>,
>(param: {
  uri: TUri;
  name: TName;
  versions: TVersions;
  metadata?: TMetaData;
}) => {
  if (!isLowerAlphanumeric(param.name)) {
    throw new Error(
      `Invalid 'name' = '${param.name}'. The 'name' must only contain alphanumeric characters. e.g. test.agent`,
    );
  }

  const mergedMetaData = {
    ...(param.metadata ?? {}),
    contractType: 'ArvoAgentContract' as const,
    rootType: param.name,
    initEventType: ArvoAgentEventTypeGen.agent.init(param.name),
    completeEventType: ArvoAgentEventTypeGen.agent.complete(param.name),
    versions: param.versions,
  };

  return createArvoContract({
    uri: param.uri,
    type: ArvoAgentEventTypeGen.agent.init(param.name),
    metadata: mergedMetaData,
    versions: Object.fromEntries(
      Object.entries(param.versions).map(([version, versionContract]) => [
        version,
        {
          accepts: OrchestrationInitEventBaseSchema.merge(versionContract.init),
          emits: {
            [ArvoAgentEventTypeGen.agent.complete(param.name)]: versionContract.complete,
          },
        },
      ]),
    ),
  }) as unknown as ArvoAgentContract<TUri, TName, TVersions, TMetaData>;
};
