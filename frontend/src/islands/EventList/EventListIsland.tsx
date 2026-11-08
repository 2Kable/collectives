import { getEvents } from "@/api/events";
import { EventDateScrubber } from "@/islands/EventList/EventDateScrubber";
import { normalizeSavedActivities } from "@/islands/EventList/EventListActivityFilter";
import { EventListFilters, pruneUnknownOptions } from "@/islands/EventList/EventListFilters";
import { EventListItem } from "@/islands/EventList/EventListItem";
import { EventListSkeleton } from "@/islands/EventList/EventListSkeleton";
import type { EventFiltersState, EventItem, EventListProps } from "@/types/event";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Paginator, type PaginatorPageChangeEvent } from "primereact/paginator";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./EventList.scss";

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
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState<number>(startingPage);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [eventCount, setEventCount] = useState<number>(0);
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

  const [eventFilters, setEventFilters] = useState<EventFiltersState>(() =>
    loadInitialFilters(props),
  );

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

  // Initial load and filter changes: reset and fetch page 1
  useEffect(() => {
    let active = true;
    setLoading(true);
    setCurrentPage(1);

    getEvents({ page: 1, pageSize: DEFAULT_PAGE_SIZE }, eventFilters)
      .then((response) => {
        if (!active) {
          return;
        }
        const loaded = response.data || [];
        setEvents(loaded);
        const total = response.total ?? (response.last_page || 1) * DEFAULT_PAGE_SIZE;
        setEventCount(total);
        setHasMore(
          loaded.length > 0 &&
            (response.total ? loaded.length < response.total : (response.last_page || 1) > 1),
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [eventFilters]);

  // Infinite scroll loader: appends next page
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const nextPage = currentPage + 1;
    setLoadingMore(true);

    getEvents({ page: nextPage, pageSize: DEFAULT_PAGE_SIZE }, eventFilters)
      .then((response) => {
        const newItems = response.data || [];
        if (newItems.length === 0) {
          setHasMore(false);
          return;
        }
        setEvents((prev) => {
          const merged = [...prev, ...newItems];
          const total = response.total ?? (response.last_page || 1) * DEFAULT_PAGE_SIZE;
          setHasMore(merged.length < total);
          return merged;
        });
        setCurrentPage(nextPage);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `#${nextPage}`);
        }
      })
      .catch(() => {
        setHasMore(false);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [currentPage, eventFilters, hasMore, loading, loadingMore]);

  // Sentinel IntersectionObserver for infinite scrolling
  useEffect(() => {
    if (
      !hasMore ||
      loading ||
      loadingMore ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);
  const dateKeys = useMemo(() => Object.keys(groupedEvents), [groupedEvents]);
  const allPanelIndices = useMemo(() => dateKeys.map((_, index) => index), [dateKeys]);

  const scrubberDates = useMemo(() => {
    return dateKeys.map((key) => ({
      key,
      label: key,
      count: groupedEvents[key]?.length || 0,
    }));
  }, [dateKeys, groupedEvents]);

  // Track currently visible date section for the scrubber
  useEffect(() => {
    if (
      dateKeys.length === 0 ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute("data-date-key");
            if (key) {
              setActiveDateKey(key);
            }
          }
        }
      },
      {
        rootMargin: "-120px 0px -70% 0px",
        threshold: 0,
      },
    );

    dateKeys.forEach((key, index) => {
      const el = document.getElementById(`date-section-${index}`);
      if (el) {
        el.setAttribute("data-date-key", key);
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [dateKeys]);

  const handleScrubToDate = useCallback((_key: string, index: number) => {
    const el = document.getElementById(`date-section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handlePaginatorChange = (pageState: PaginatorPageChangeEvent) => {
    const pageNumber = pageState.page + 1;
    setCurrentPage(pageNumber);
    setLoading(true);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#${pageNumber}`);
    }
    getEvents({ page: pageNumber, pageSize: pageState.rows }, eventFilters)
      .then((response) => {
        const loaded = response.data || [];
        setEvents(loaded);
        const total = response.total ?? (response.last_page || 1) * pageState.rows;
        setEventCount(total);
        setHasMore(
          loaded.length > 0 &&
            (response.total
              ? loaded.length < response.total
              : (response.last_page || 1) > pageNumber),
        );
      })
      .finally(() => {
        setLoading(false);
        gotoEvents();
      });
  };

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
          <div className="collectives-list-filters-sticky-wrapper">
            <EventListFilters
              filters={eventFilters}
              activityGroups={props.activityGroups}
              eventTypes={props.eventTypes}
              eventTags={props.eventTags}
              onFiltersChange={setEventFilters}
            />
          </div>

          <EventDateScrubber
            dates={scrubberDates}
            activeDateKey={activeDateKey}
            onScrubToDate={handleScrubToDate}
          />

          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((n) => (
                <EventListSkeleton key={n} />
              ))}
            </>
          ) : (
            <>
              <Accordion multiple activeIndex={allPanelIndices}>
                {dateKeys.map((date, index) => (
                  <AccordionTab
                    key={date}
                    header={date}
                    pt={{
                      headerAction: {
                        id: `date-section-${index}`,
                        className: "p-accordionheader",
                        style: { scrollMarginTop: "140px" },
                      },
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

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-hidden="true" />

              {loadingMore && (
                <div className="infinite-scroll-loading">
                  <EventListSkeleton />
                </div>
              )}

              {!hasMore && events.length > 0 && (
                <div className="infinite-scroll-end">
                  <span>
                    {events.length} collective{events.length > 1 ? "s" : ""} affichée
                    {events.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <Paginator
                first={(currentPage - 1) * DEFAULT_PAGE_SIZE}
                rows={DEFAULT_PAGE_SIZE}
                totalRecords={eventCount}
                rowsPerPageOptions={[25, 50, 100]}
                onPageChange={handlePaginatorChange}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
