import { IslandErrorBoundary } from "@/components/ErrorBoundary";
import { islandRegistry } from "@/islands/registry";
import { registerFrenchLocale } from "@/locale/fr";
import { PrimeReactProvider } from "primereact/api";
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-blue/theme.css";

const ISLAND_SELECTOR = "[data-react-island]";
const PROPS_SELECTOR = "script[data-island-props]";
const MOUNTED_ATTRIBUTE = "data-island-mounted";

registerFrenchLocale();

export function parseIslandProps(container: Element): Record<string, unknown> {
  const scriptEl = container.querySelector(PROPS_SELECTOR);
  if (!scriptEl || !scriptEl.textContent) {
    return {};
  }
  try {
    return JSON.parse(scriptEl.textContent) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function mountIslands(root: ParentNode = document): void {
  const elements = root.querySelectorAll(ISLAND_SELECTOR);
  for (const element of elements) {
    if (element.getAttribute(MOUNTED_ATTRIBUTE) === "true") {
      continue;
    }

    const islandName = element.getAttribute("data-react-island");
    if (!islandName) {
      continue;
    }

    const loader = islandRegistry[islandName];
    if (!loader) {
      continue;
    }

    const props = parseIslandProps(element);
    const LazyIsland = lazy(loader);

    element.setAttribute(MOUNTED_ATTRIBUTE, "true");
    createRoot(element).render(
      <StrictMode>
        <PrimeReactProvider value={{ locale: "fr" }}>
          <IslandErrorBoundary islandName={islandName}>
            <Suspense fallback={null}>
              <LazyIsland {...props} />
            </Suspense>
          </IslandErrorBoundary>
        </PrimeReactProvider>
      </StrictMode>,
    );
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountIslands());
  } else {
    mountIslands();
  }
}
