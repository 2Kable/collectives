import { searchLeaders } from "@/api/events";
import { FilterDropdownSelect } from "@/components/FilterDropdownSelect";
import { EventListActivityFilter } from "@/islands/EventList/EventListActivityFilter";
import type { ActivityGroup, EventFiltersState, NamedOption } from "@/types/event";
import { AutoComplete, type AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Calendar } from "primereact/calendar";
import { useMemo, useState } from "react";

const isSet = (value: unknown): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

export function pruneUnknownOptions(
  selected: string[] | undefined,
  options: NamedOption[],
): string[] {
  return (selected || []).filter((id) => options.some((option) => option.id === id));
}

export interface EventListFiltersProps {
  filters: EventFiltersState;
  activityGroups: ActivityGroup[];
  eventTypes: NamedOption[];
  eventTags: NamedOption[];
  onFiltersChange: (next: EventFiltersState) => void;
}

export function EventListFilters({
  filters,
  activityGroups,
  eventTypes,
  eventTags,
  onFiltersChange,
}: EventListFiltersProps) {
  const [leaderSuggestions, setLeaderSuggestions] = useState<string[]>([]);

  const advancedFilterCount = useMemo(() => {
    const advancedValues = [
      filters.eventTypes,
      filters.eventTags,
      filters.date,
      filters.title,
      filters.leader,
      filters.displayCancelled,
    ];
    return advancedValues.filter(isSet).length;
  }, [
    filters.date,
    filters.displayCancelled,
    filters.eventTags,
    filters.eventTypes,
    filters.leader,
    filters.title,
  ]);

  const activeFilterCount = useMemo(
    () => advancedFilterCount + (isSet(filters.activities) ? 1 : 0),
    [advancedFilterCount, filters.activities],
  );

  const [displayMoreFilters, setDisplayMoreFilters] = useState<boolean>(advancedFilterCount > 0);

  const updateFilters = (patch: Partial<EventFiltersState>) => {
    onFiltersChange({
      ...filters,
      ...patch,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      activities: [],
      eventTypes: [],
      eventTags: [],
      date: null,
      title: "",
      leader: "",
      displayCancelled: false,
    });
  };

  const handleLeaderComplete = async (event: AutoCompleteCompleteEvent) => {
    if (!event.query) {
      return;
    }
    const results = await searchLeaders(event.query);
    setLeaderSuggestions(results.map((item) => item.full_name));
  };

  return (
    <div
      className="collectives-list-filters"
      // biome-ignore lint/a11y/useSemanticElements: <search> triggers unrecognized tag warning in React 18 DOM
      role="search"
      aria-label="Filtrer les collectives"
    >
      <EventListActivityFilter
        groups={activityGroups}
        value={filters.activities}
        onChange={(activities) => updateFilters({ activities })}
      />

      <button
        type="button"
        className="toggle-button collectives-list-filters-toggle-label button-primary"
        onClick={() => setDisplayMoreFilters((prev) => !prev)}
        aria-expanded={displayMoreFilters}
      >
        {!displayMoreFilters ? (
          <span>+ Plus de filtres</span>
        ) : (
          <span>&minus; Moins de filtres</span>
        )}
        {!displayMoreFilters && advancedFilterCount > 0 && (
          <span className="filter-badge">
            {advancedFilterCount}
            <span className="visually-hidden"> filtre(s) masqué(s) actif(s)</span>
          </span>
        )}
      </button>

      {displayMoreFilters && (
        <>
          <FilterDropdownSelect
            className="select-type"
            placeholder="Tous types"
            ariaLabel="Filtrer par type d'événement"
            options={eventTypes}
            value={filters.eventTypes}
            onChange={(eventTypes) => updateFilters({ eventTypes })}
            getIconUrl={(item) => `/static/caf/icon/${item.id}.svg`}
          />

          <FilterDropdownSelect
            className="select-tag"
            placeholder="Tous labels"
            ariaLabel="Filtrer par label"
            options={eventTags}
            value={filters.eventTags}
            onChange={(eventTags) => updateFilters({ eventTags })}
            getIconUrl={(item) => `/static/caf/icon/${item.id}.svg`}
          />

          <label className="borders" htmlFor="filter-date">
            <i className="pi pi-calendar" />
            <span>Depuis</span>
            <Calendar
              inputId="filter-date"
              dateFormat="dd/mm/yy"
              value={filters.date}
              onChange={(e) => updateFilters({ date: e.value ?? null })}
              placeholder="Aujourd'hui"
            />
          </label>

          <label className="borders" htmlFor="filter-title">
            <i className="pi pi-search" />
            <span className="visually-hidden">Titre de la collective</span>
            <input
              id="filter-title"
              type="text"
              value={filters.title}
              onChange={(e) => updateFilters({ title: e.target.value })}
              placeholder="Titre"
            />
          </label>

          <AutoComplete
            inputId="filter-leader"
            value={filters.leader}
            suggestions={leaderSuggestions}
            completeMethod={handleLeaderComplete}
            onChange={(e) => updateFilters({ leader: e.value || "" })}
            placeholder="Encadrant"
            aria-label="Rechercher un encadrant"
          />

          <button
            type="button"
            id="cancelled"
            className={`toggle-button font-size-s${filters.displayCancelled ? " enabled" : ""}`}
            onClick={() => updateFilters({ displayCancelled: !filters.displayCancelled })}
            aria-pressed={filters.displayCancelled}
          >
            Sorties annulées :{" "}
            {filters.displayCancelled ? (
              <span className="icon-button display-for-on">
                affichées <img src="/static/img/icon/ionicon/eye.svg" alt="" />
              </span>
            ) : (
              <span className="icon-button display-for-off">
                cachées <img src="/static/img/icon/ionicon/eye-off.svg" alt="" />
              </span>
            )}
          </button>
        </>
      )}

      {activeFilterCount > 0 && (
        <button
          type="button"
          className="toggle-button font-size-s reset-filters"
          onClick={resetFilters}
        >
          <i className="pi pi-times" />
          Tout effacer<span className="visually-hidden"> les filtres</span>
        </button>
      )}
    </div>
  );
}
