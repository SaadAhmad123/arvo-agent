/**
 * Base prefix for all agentic event types
 */
const prefix = 'arvo.agent' as const;

const generateAgentTypeGen = <T extends string>(name: T) => {
  const _prefix = `${prefix}.${name}` as const;
  const _initType = <T extends string>(name: T): `${typeof _prefix}.${T}` => `${_prefix}.${name}`;

  return {
    prefix: _prefix,
    isEvent: (eventType: string) => eventType.startsWith(_prefix),
    init: _initType,
    complete: <T extends string>(name: T): `${ReturnType<typeof _initType<T>>}.done` => `${_initType(name)}.done`,
    systemError: <T extends string>(name: T): `sys.${ReturnType<typeof _initType<T>>}.error` =>
      `sys.${_initType(name)}.error`,
  } as const;
};

/**
 * Pre-configured type generators for standard agentic domains.
 * Provides type-safe event type generation for tools and prompts.
 */
export const ArvoAgentEventTypeGen = {
  toolset: generateAgentTypeGen('toolset'),
  promptset: generateAgentTypeGen('promptset'),
} as const;
