// Editor metadata is for DOM nodes, not Three.js pierced properties.
export function cleanSceneProps<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith('data-'))) as T;
}