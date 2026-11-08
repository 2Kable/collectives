import * as eventsApi from "@/api/events";
import EventListIsland, {
  formatEventGroupDate,
  groupEventsByDate,
} from "@/islands/EventList/EventListIsland";
import { registerFrenchLocale } from "@/locale/fr";
import type { EventItem, EventListProps } from "@/types/event";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PrimeReactProvider } from "primereact/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

registerFrenchLocale();

const sampleEvent: EventItem = {
  id: 42,
  title: "Traversée des Aravis",
  start: "2026-11-15T08:00:00",
  end: "2026-11-15T17:00:00",
  num_slots: 8,
  num_online_slots: 8,
  free_slots: 2,
  occupied_slots: 6,
  photo_uri: "/static/img/default/events/event1.svg",
  view_uri: "/collectives/42-traversee-des-aravis",
  leaders: [{ id: 1, full_name: "Jean Dupont", avatar_uri: "/static/img/avatar.png" }],
  activity_types: [{ id: "alpinisme", name: "Alpinisme", icon: "alpinisme" }],
  activity_type_names: "Alpinisme",
  event_type: { id: 1, short: "collective", name: "Collective" },
  is_confirmed: true,
  status: 0,
  visibility: 0,
  tags: [{ short: "rando_cool", name: "Rando Cool" }],
  has_free_slots: true,
  has_free_waiting_slots: false,
  has_free_online_slots: true,
  formated_datetime_range: "dimanche 15 novembre 2026 | 8h-17h",
};

const sampleProps: EventListProps = {
  activityGroups: [
    {
      kind: "Regular",
      label: "Activités",
      items: [{ id: "alpinisme", name: "Alpinisme", icon: "alpinisme" }],
    },
  ],
  eventTypes: [{ id: "collective", name: "Collective" }],
  eventTags: [{ id: "rando_cool", name: "Rando Cool" }],
  eventStatusLabels: {
    "0": "Confirmée",
    "1": "En attente",
    "2": "Annulée",
  },
  isAuthenticated: true,
  siteParams: {
    coverLogo: "/static/caf/logo.png",
    arrowDown: "/static/img/arrow.svg",
    bannerMessage: "<p>Bienvenue sur Collectives</p>",
  },
  initialActivity: null,
};

describe("EventListIsland", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("formats French group dates and groups events by date", () => {
    expect(formatEventGroupDate("2026-11-01T08:00:00")).toBe("dimanche 1er novembre 2026");
    expect(formatEventGroupDate("2026-11-15T08:00:00")).toBe("dimanche 15 novembre 2026");

    const grouped = groupEventsByDate([sampleEvent]);
    expect(Object.keys(grouped)).toEqual(["dimanche 15 novembre 2026"]);
    expect(grouped["dimanche 15 novembre 2026"]).toHaveLength(1);
  });

  it("fetches and renders events, banner, and expands filters", async () => {
    const getEventsSpy = vi.spyOn(eventsApi, "getEvents").mockResolvedValue({
      data: [sampleEvent],
      last_page: 1,
      total: 1,
    });

    render(
      <PrimeReactProvider value={{ locale: "fr" }}>
        <EventListIsland {...sampleProps} />
      </PrimeReactProvider>,
    );

    expect(screen.getByText("Bienvenue sur Collectives")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Traversée des Aravis")).toBeDefined();
    });

    expect(screen.getByText("Jean Dupont")).toBeDefined();
    expect(screen.getByText("6/8")).toBeDefined();
    expect(getEventsSpy).toHaveBeenCalledTimes(1);

    const toggleButton = screen.getByText("+ Plus de filtres");
    fireEvent.click(toggleButton);

    expect(screen.getByPlaceholderText("Titre")).toBeDefined();
    expect(screen.getByText(/Sorties annulées/)).toBeDefined();
  });
});
