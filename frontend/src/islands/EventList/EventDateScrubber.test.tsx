import { type DateScrubberItem, EventDateScrubber } from "@/islands/EventList/EventDateScrubber";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockDates: DateScrubberItem[] = [
  { key: "2026-11-15", label: "dimanche 15 novembre 2026", count: 3 },
  { key: "2026-11-21", label: "samedi 21 novembre 2026", count: 1 },
  { key: "2026-11-22", label: "dimanche 22 novembre 2026", count: 2 },
];

describe("EventDateScrubber", () => {
  it("does not render if there are fewer than 2 dates", () => {
    const { container } = render(
      <EventDateScrubber
        dates={[mockDates[0]]}
        activeDateKey="2026-11-15"
        onScrubToDate={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders track and ticks when multiple dates are provided", () => {
    render(
      <EventDateScrubber dates={mockDates} activeDateKey="2026-11-21" onScrubToDate={vi.fn()} />,
    );

    const scrubber = screen.getByRole("navigation", {
      name: "Navigation rapide par date",
    });
    expect(scrubber).toBeDefined();

    const ticks = scrubber.querySelectorAll(".date-scrubber-tick");
    expect(ticks).toHaveLength(3);
    // Active date index is 1 ("2026-11-21")
    expect(ticks[1].className).toContain("is-active");
  });

  it("triggers onScrubToDate when pointer interacts with the track", () => {
    // Ensure PointerEvent exists in jsdom
    if (!window.PointerEvent) {
      window.PointerEvent = window.MouseEvent as unknown as typeof PointerEvent;
    }

    // Mock getBoundingClientRect on Element.prototype before rendering
    vi.spyOn(window.Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 300,
      left: 0,
      right: 30,
      width: 30,
      height: 200,
      x: 0,
      y: 100,
      toJSON: () => {},
    });

    const onScrubMock = vi.fn();
    render(
      <EventDateScrubber
        dates={mockDates}
        activeDateKey="2026-11-15"
        onScrubToDate={onScrubMock}
      />,
    );

    const scrubber = screen.getByRole("navigation", {
      name: "Navigation rapide par date",
    });
    const track = scrubber.querySelector(".date-scrubber-track") as HTMLElement;
    expect(track).toBeDefined();

    // Simulate pointer down near bottom (clientY = 300 -> 100% -> index 2)
    fireEvent.pointerDown(track, { clientY: 300, pointerId: 1 });

    expect(onScrubMock).toHaveBeenCalledWith("2026-11-22", 2);

    // Callout should be visible with date and count
    expect(screen.getByText("dimanche 22 novembre 2026")).toBeDefined();
    expect(screen.getByText("2 collectives")).toBeDefined();
  });
});
