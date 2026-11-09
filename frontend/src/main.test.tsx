import { registerIsland } from "@/islands/registry";
import { mountIslands, parseIslandProps } from "@/main";
import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("React Islands runtime", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("parses JSON props from the embedded script tag", () => {
    document.body.innerHTML = `
      <div data-react-island="DemoIsland">
        <script type="application/json" data-island-props>
          {"title": "Collective Alpinisme", "slots": 6}
        </script>
      </div>
    `;
    const container = document.querySelector("[data-react-island]");
    expect(container).not.toBeNull();
    const props = parseIslandProps(container as Element);
    expect(props).toEqual({ title: "Collective Alpinisme", slots: 6 });
  });

  it("mounts a registered island and passes props", async () => {
    registerIsland("TestGreeting", async () => ({
      default: ({ clubName }: { clubName: string }) => <p>Bienvenue au {clubName}</p>,
    }));

    document.body.innerHTML = `
      <div data-react-island="TestGreeting">
        <script type="application/json" data-island-props>
          {"clubName": "CAF Annecy"}
        </script>
      </div>
    `;

    await act(async () => {
      mountIslands();
    });

    await waitFor(() => {
      expect(screen.getByText("Bienvenue au CAF Annecy")).toBeDefined();
    });
  });

  it("catches island errors inside IslandErrorBoundary without crashing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      registerIsland("BrokenIsland", async () => ({
        default: () => {
          throw new Error("Simulated render error");
        },
      }));

      document.body.innerHTML = `
        <div data-react-island="BrokenIsland">
          <script type="application/json" data-island-props>{}</script>
        </div>
      `;

      await act(async () => {
        mountIslands();
      });

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain("BrokenIsland");
      });
    } finally {
      errorSpy.mockRestore();
    }
  });
});
