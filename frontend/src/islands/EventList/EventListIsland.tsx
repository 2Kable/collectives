import { getEvents } from "@/api/events";
import { normalizeSavedActivities } from "@/islands/EventList/EventListActivityFilter";
import { EventListFilters, pruneUnknownOptions } from "@/islands/EventList/EventListFilters";
import { EventListItem } from "@/islands/EventList/EventListItem";
import { EventListSkeleton } from "@/islands/EventList/EventListSkeleton";
import type { EventFiltersState, EventItem, EventListProps } from "@/types/event";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Paginator, type PaginatorPageChangeEvent } from "primereact/paginator";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FILTERS_STORAGE_KEY = "eventlist-filters";
const DEFAULT_PAGE_SIZE = 25;

export function formatEventGroupDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
  const dayNum = date.getDate();
  const dayStr = dayNum === 1 ? "1er" : String(dayNum);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(date);
  const year = date.getFullYear();
  return `${weekday} ${dayStr} ${month} ${year}`;
}

export function groupEventsByDate(events: EventItem[]): Record<string, EventItem[]> {
  return events.reduce<Record<string, EventItem[]>>((acc, event) => {
    const dateKey = formatEventGroupDate(event.start);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});
}

function getStartingPageFromHash(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  const match = window.location.hash.match(/#(\d+)/);
  return match?.[1] ? Number(match[1]) : 1;
}

function loadInitialFilters(props: EventListProps): EventFiltersState {
  let saved: Partial<EventFiltersState> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw) as Partial<EventFiltersState>;
      }
    } catch {
      saved = {};
    }
  }

  const rawActivities = props.initialActivity ? [props.initialActivity] : saved.activities || [];

  return {
    activities: normalizeSavedActivities(rawActivities, props.activityGroups),
    eventTypes: pruneUnknownOptions(saved.eventTypes, props.eventTypes),
    eventTags: pruneUnknownOptions(saved.eventTags, props.eventTags),
    date: null,
    title: "",
    leader: "",
    displayCancelled: Boolean(saved.displayCancelled),
  };
}

export default function EventListIsland(props: EventListProps) {
  const startingPage = useMemo(() => getStartingPageFromHash(), []);
  const eventListRef = useRef<HTMLDivElement>(null);

  const [eventParams, setEventParams] = useState({
    page: startingPage,
    pageSize: DEFAULT_PAGE_SIZE,
    first: (startingPage - 1) * DEFAULT_PAGE_SIZE,
  });

  const [eventFilters, setEventFilters] = useState<EventFiltersState>(() =>
    loadInitialFilters(props),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [groupedEvents, setGroupedEvents] = useState<Record<string, EventItem[]>>({});
  const [eventCount, setEventCount] = useState<number>(0);

  const gotoEvents = useCallback(() => {
    eventListRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    gotoEvents();
  }, [gotoEvents]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(eventFilters));
    } catch {
      // Ignore storage quota errors
    }
  }, [eventFilters]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getEvents({ page: eventParams.page, pageSize: eventParams.pageSize }, eventFilters)
      .then((response) => {
        if (!active) {
          return;
        }
        setGroupedEvents(groupEventsByDate(response.data || []));
        setEventCount(response.total ?? (response.last_page || 0) * eventParams.pageSize);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [eventFilters, eventParams.page, eventParams.pageSize]);

  const handlePaginatorChange = (pageState: PaginatorPageChangeEvent) => {
    const pageNumber = pageState.page + 1;
    setEventParams({
      page: pageNumber,
      pageSize: pageState.rows,
      first: pageState.first,
    });
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#${pageNumber}`);
    }
  };

  const dateKeys = Object.keys(groupedEvents);
  const allPanelIndices = useMemo(() => dateKeys.map((_, index) => index), [dateKeys]);

  return (
    <>
      <div id="cover">
        <div>
          <img src={props.siteParams.coverLogo} className="motto" alt="Club Alpin Français" />
          <br />
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Preserves existing cover arrow img markup */}
          <img
            src={props.siteParams.arrowDown}
            className="arrow"
            alt="Descendre vers les collectives"
            onClick={gotoEvents}
          />
        </div>
      </div>

      <div ref={eventListRef} id="eventlist" className="page-content">
        {props.siteParams.bannerMessage && (
          <div id="banner-message">
            <h5 className="heading-1">Message important</h5>
            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-sanitized markdown HTML from Configuration.BANNER_MESSAGE
              dangerouslySetInnerHTML={{
                __html: props.siteParams.bannerMessage,
              }}
            />
          </div>
        )}

        <div className="collectives-list">
          <EventListFilters
            filters={eventFilters}
            activityGroups={props.activityGroups}
            eventTypes={props.eventTypes}
            eventTags={props.eventTags}
            onFiltersChange={setEventFilters}
          />

          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((n) => (
                <EventListSkeleton key={n} />
              ))}
            </>
          ) : (
            <Accordion multiple activeIndex={allPanelIndices}>
              {dateKeys.map((date) => (
                <AccordionTab
                  key={date}
                  header={date}
                  pt={{
                    headerAction: { className: "p-accordionheader" },
                  }}
                >
                  {groupedEvents[date].map((eventItem) => (
                    <EventListItem
                      key={eventItem.id}
                      eventItem={eventItem}
                      eventStatusLabels={props.eventStatusLabels}
                    />
                  ))}
                </AccordionTab>
              ))}
            </Accordion>
          )}

          <Paginator
            first={eventParams.first}
            rows={eventParams.pageSize}
            totalRecords={eventCount}
            rowsPerPageOptions={[25, 50, 100]}
            onPageChange={handlePaginatorChange}
          />
        </div>
      </div>
    </>
  );
}
