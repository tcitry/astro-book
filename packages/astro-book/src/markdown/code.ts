type Node = {
  properties?: Record<string, unknown>;
  attributes?: { name?: string }[];
};

/** Independently styled components own their code and diagram behavior. */
export const isCodeIsland = (node: Node) => ['data-book-island', 'data-demo', 'dataBookIsland', 'dataDemo']
  .some((name) => node.properties?.[name] !== undefined || node.attributes?.some((attribute) => attribute.name === name));
