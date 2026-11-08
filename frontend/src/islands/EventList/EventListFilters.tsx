import { searchLeaders } from "@/api/events";
import { EventListActivityFilter } from "@/islands/EventList/EventListActivityFilter";
import type { ActivityGroup, EventFiltersState, NamedOption } from "@/types/event";
import { AutoComplete, type AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Chip } from "primereact/chip";
import { MultiSelect } from "primereact/multiselect";
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

  const findInOptions = (list: NamedOption[], id: string) => list.find((item) => item.id === id);

  const removeElement = (list: string[], id: string) => list.filter((item) => item !== id);

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
          <MultiSelect
            className="select-type"
            value={filters.eventTypes}
            options={eventTypes}
            optionLabel="name"
            optionValue="id"
            scrollHeight="90vh"
            placeholder="Tout types d'événement"
            display="chip"
            appendTo="self"
            showSelectAll={false}
            aria-label="Filtrer par type d'événement"
            onChange={(e) => updateFilters({ eventTypes: e.value || [] })}
            pt={{
              panel: { className: "p-multiselect-overlay" },
              list: { className: "p-multiselect-list" },
              item: { className: "p-multiselect-option" },
            }}
            itemTemplate={(option: NamedOption) => (
              <div className="flex items-center">
                <img className="icon" alt={option.name} src={`/static/caf/icon/${option.id}.svg`} />
                <div>{option.name}</div>
              </div>
            )}
            selectedItemTemplate={(value: string) => {
              if (!value) {
                return null;
              }
              const found = findInOptions(eventTypes, value);
              if (!found) {
                return null;
              }
              return (
                <Chip
                  key={value}
                  label={found.name}
                  image={`/static/caf/icon/${value}.svg`}
                  removable
                  onRemove={() => {
                    updateFilters({
                      eventTypes: removeElement(filters.eventTypes, value),
                    });
                    return true;
                  }}
                />
              );
            }}
            panelFooterTemplate={() =>
              filters.eventTypes.length > 0 ? (
                <div className="flex justify-between">
                  <div />
                  <Button
                    label="Effacer"
                    severity="danger"
                    text
                    size="small"
                    icon="pi pi-times"
                    onClick={() => updateFilters({ eventTypes: [] })}
                  />
                </div>
              ) : null
            }
          />

          <MultiSelect
            className="select-tag"
            value={filters.eventTags}
            options={eventTags}
            optionLabel="name"
            optionValue="id"
            scrollHeight="90vh"
            placeholder="Tous labels"
            display="chip"
            appendTo="self"
            showSelectAll={false}
            aria-label="Filtrer par label"
            onChange={(e) => updateFilters({ eventTags: e.value || [] })}
            pt={{
              panel: { className: "p-multiselect-overlay" },
              list: { className: "p-multiselect-list" },
              item: { className: "p-multiselect-option" },
            }}
            itemTemplate={(option: NamedOption) => (
              <div className="flex items-center">
                <img className="icon" alt={option.name} src={`/static/caf/icon/${option.id}.svg`} />
                <div>{option.name}</div>
              </div>
            )}
            selectedItemTemplate={(value: string) => {
              if (!value) {
                return null;
              }
              const found = findInOptions(eventTags, value);
              if (!found) {
                return null;
              }
              return (
                <Chip
                  key={value}
                  label={found.name}
                  image={`/static/caf/icon/${value}.svg`}
                  removable
                  onRemove={() => {
                    updateFilters({
                      eventTags: removeElement(filters.eventTags, value),
                    });
                    return true;
                  }}
                />
              );
            }}
            panelFooterTemplate={() =>
              filters.eventTags.length > 0 ? (
                <div className="flex justify-between">
                  <div />
                  <Button
                    label="Effacer"
                    severity="danger"
                    text
                    size="small"
                    icon="pi pi-times"
                    onClick={() => updateFilters({ eventTags: [] })}
                  />
                </div>
              ) : null
            }
          />

          <div className="input date">
            <label className="borders" htmlFor="filter-date">
              <i className="pi pi-calendar" />
              Depuis
              <Calendar
                inputId="filter-date"
                dateFormat="dd/mm/yy"
                value={filters.date}
                onChange={(e) => updateFilters({ date: e.value ?? null })}
                placeholder="Aujourd'hui"
                pt={{
                  root: { className: "p-datepicker" },
                }}
              />
            </label>
          </div>

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
