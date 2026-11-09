import type { ComponentType } from "react";

// biome-ignore lint/suspicious/noExplicitAny: Island components accept arbitrary JSON-serializable props
export type IslandComponent = ComponentType<any>;

export type IslandLoader = () => Promise<{ default: IslandComponent }>;

/**
 * Registry mapping `data-react-island` names to lazy-loaded island modules.
 * Each migrated island is registered here so Vite splits it into an on-demand chunk.
 */
export const islandRegistry: Record<string, IslandLoader> = {
  EventList: () => import("@/islands/EventList/EventListIsland"),
};

export function registerIsland(name: string, loader: IslandLoader): void {
  islandRegistry[name] = loader;
}
