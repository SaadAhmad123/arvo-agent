import {
  ArvoEvent,
  ArvoContractRecord,
  VersionedArvoContract,
  InferVersionedArvoContract,
  ArvoSemanticVersion,
  CreateArvoEvent,
} from 'arvo-core';
import { AbstractArvoEventHandler, ArvoEventHandlerOpenTelemetryOptions } from 'arvo-event-handler';
import {
  ArvoAgentContract,
  ArvoAgentToolsetContract,
  createArvoAgentContract,
  createArvoAgentToolsetContract,
} from '../../contracts';
import { IMachineMemory } from 'arvo-xstate';
import { Span } from '@opentelemetry/api';
import { z } from 'zod';

export type ArvoAgentHandlerOutput<TEmitContract extends Record<string, z.ZodTypeAny>> = {
  [K in keyof TEmitContract]: Pick<
    CreateArvoEvent<z.infer<TEmitContract[K]>, K & string>,
    'id' | 'time' | 'type' | 'data' | 'to' | 'accesscontrol' | 'redirectto'
  > & {
    /**
     * An optional override for the execution units of this specific event.
     *
     * @remarks
     * Execution units represent the computational cost or resources required to process this event.
     * If not provided, the default value defined in the handler's constructor will be used.
     */
    executionunits?: number;
    /** Optional extensions for the event. */
    __extensions?: Record<string, string | number | boolean>;
  };
}[keyof TEmitContract];

export type ArvoAgentHandler<
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TContract extends VersionedArvoContract<any, any> = VersionedArvoContract<any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: Needs to be general
  TToolContract extends VersionedArvoContract<ArvoAgentToolsetContract, ArvoSemanticVersion> = VersionedArvoContract<
    ArvoAgentToolsetContract,
    ArvoSemanticVersion
  >,
> = (param: {
  event:
    | InferVersionedArvoContract<TContract>['accepts']
    | InferVersionedArvoContract<TToolContract>['emitList'][number]
    | InferVersionedArvoContract<TToolContract>['systemError'];
  span: Span;
  contracts: {
    toolset?: TToolContract;
  };
}) => Promise<
ArvoAgentHandlerOutput<TContract['emits']> | ArvoAgentHandlerOutput<TToolContract['emits']> | void
>;

export type ArvoAgentParam<
  TContract extends VersionedArvoContract<ArvoAgentContract, any>,
  TToolContract extends VersionedArvoContract<ArvoAgentToolsetContract, any>,
> = {
  contracts: {
    self: TContract;
    toolset: TToolContract;
  };
  executionunits: number;
  handler: ArvoAgentHandler<TContract, TToolContract>;
};

export const createArvoAgent = <
  TContract extends VersionedArvoContract<ArvoAgentContract, any>,
  TToolContract extends VersionedArvoContract<ArvoAgentToolsetContract, any>,
>(
  param: ArvoAgentParam<TContract, TToolContract>,
) => {};

const testContract = createArvoAgentContract({
  uri: '#/agent/test',
  name: 'test',
  versions: {
    '1.0.0': {
      init: z.object({ message: z.string() }),
      complete: z.object({ message: z.string() }),
    },
  },
});

const toolContract = createArvoAgentToolsetContract({
  uri: '#/agent/test/tool',
  name: 'test',
  versions: {
    '1.0.0': {
      get_weather: {
        description: 'get weather',
        emits: z.object({ location: z.string() }),
        accepts: z.object({}),
      },
    },
  },
});

const test = createArvoAgent({
  contracts: {
    self: testContract.version('1.0.0'),
    toolset: toolContract.version('1.0.0')
  },
  executionunits: 1,
  handler: async ({event}) => {
    
  }
});

export class ArvoAgent<TContract extends ArvoAgentContract = ArvoAgentContract> extends AbstractArvoEventHandler {
  readonly contract: TContract;
  readonly executionunits: number;
  readonly memory: IMachineMemory<{}>;
  get source() {
    return this.contract.type;
  }

  constructor(param: {
    contract: TContract;
    executionunits: number;
    memory: IMachineMemory<{}>;
  }) {
    super();
    (this.contract = param.contract), (this.executionunits = param.executionunits);
    this.memory = param.memory;
  }

  execute(event: ArvoEvent, opentelemetry: ArvoEventHandlerOpenTelemetryOptions): Promise<ArvoEvent[]> {
    throw new Error('Method not implemented.');
  }
  get systemErrorSchema(): ArvoContractRecord {
    throw new Error('Method not implemented.');
  }
}
