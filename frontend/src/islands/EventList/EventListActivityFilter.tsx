import type { ActivityGroup, ActivityOption } from "@/types/event";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";
import { OverlayPanel } from "primereact/overlaypanel";
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
} from "react";

const LEGACY_SERVICES = "__services";
const MAX_CHIPS = 3;

export interface EventListActivityFilterProps {
  groups: ActivityGroup[];
  value: string[];
  onChange: (nextActivities: string[]) => void;
}

export function normalizeSavedActivities(saved: string[], groups: ActivityGroup[]): string[] {
  const items = groups.flatMap((group) => group.items);
  const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));
  const services =
    groups.find((group) => group.kind === "Service")?.items.map((item) => item.id) || [];

  return saved
    .flatMap((id) => (id === LEGACY_SERVICES ? services : [id]))
    .filter((id) => id in itemsById);
}

export function EventListActivityFilter({ groups, value, onChange }: EventListActivityFilterProps) {
  const overlayRef = useRef<OverlayPanel>(null);

  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const allIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemsById = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, item])),
    [items],
  );

  useEffect(() => {
    const known = normalizeSavedActivities(value, groups);
    if (known.length !== value.length || known.some((id, index) => id !== value[index])) {
      onChange(allIds.filter((id) => known.includes(id)));
    }
  }, [allIds, groups, onChange, value]);

  const selected = useMemo(
    () => new Set((value || []).filter((id) => id in itemsById)),
    [itemsById, value],
  );

  const updateSelection = (nextSelection: Set<string>) => {
    onChange(allIds.filter((id) => nextSelection.has(id)));
  };

  const toggleItem = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelection(next);
  };

  const getGroupState = (group: ActivityGroup): "none" | "some" | "all" => {
    const count = group.items.filter((item) => selected.has(item.id)).length;
    if (count === 0) {
      return "none";
    }
    return count === group.items.length ? "all" : "some";
  };

  const toggleGroup = (group: ActivityGroup) => {
    const next = new Set(selected);
    const shouldCheck = getGroupState(group) !== "all";
    for (const item of group.items) {
      if (shouldCheck) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
    }
    updateSelection(next);
  };

  const chips: ActivityOption[] = useMemo(() => {
    if (selected.size > MAX_CHIPS) {
      return [];
    }
    return allIds.filter((id) => selected.has(id)).map((id) => itemsById[id]);
  }, [allIds, itemsById, selected]);

  const summary = useMemo(() => {
    if (selected.size === 0) {
      return "Toutes activités";
    }
    if (chips.length > 0) {
      return "";
    }
    return `${selected.size} activités`;
  }, [chips.length, selected.size]);

  const handleToggleOverlay = (event: MouseEvent | KeyboardEvent) => {
    overlayRef.current?.toggle(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggleOverlay(event);
    }
  };

  const iconUrl = (item: ActivityOption) => `/static/caf/icon/${item.icon}.svg`;

  return (
    <div className="activity-filter">
      <div
        className="activity-filter-trigger"
        // biome-ignore lint/a11y/useSemanticElements: Preserves existing .activity-filter-trigger div layout containing removable Chip buttons
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-label="Filtrer par activité"
        onClick={handleToggleOverlay}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`activity-filter-trigger-label${selected.size === 0 ? " is-placeholder p-placeholder" : ""}`}
        >
          {summary && (
            <span className={selected.size === 0 ? "is-placeholder p-placeholder" : undefined}>
              {summary}
            </span>
          )}
          {chips.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              image={iconUrl(item)}
              removable
              onClick={(e) => e.stopPropagation()}
              onRemove={() => {
                toggleItem(item.id);
                return false;
              }}
            />
          ))}
        </span>
        <i className="pi pi-chevron-down" />
      </div>

      <OverlayPanel ref={overlayRef}>
        <div className="activity-filter-panel">
          <div
            className="activity-filter-columns"
            style={{ "--columns": groups.length } as CSSProperties}
          >
            {groups.map((group) => {
              const state = getGroupState(group);
              return (
                <div className="activity-filter-column" key={group.kind}>
                  <label className="activity-filter-group">
                    <input
                      type="checkbox"
                      checked={state === "all"}
                      ref={(inputEl) => {
                        if (inputEl) {
                          inputEl.indeterminate = state === "some";
                        }
                      }}
                      onChange={() => toggleGroup(group)}
                    />
                    {group.label}
                  </label>
                  {group.items.map((item) => (
                    <label className="activity-filter-item" key={item.id}>
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                      <img className="icon" src={iconUrl(item)} alt="" />
                      {item.name}
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
          {selected.size > 0 && (
            <div className="activity-filter-footer">
              <Button
                label="Effacer"
                severity="danger"
                text
                size="small"
                icon="pi pi-times"
                onClick={() => updateSelection(new Set())}
              />
            </div>
          )}
        </div>
      </OverlayPanel>
    </div>
  );
}
