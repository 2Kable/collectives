import type { NamedOption } from "@/types/event";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";
import { OverlayPanel } from "primereact/overlaypanel";
import { type KeyboardEvent, useMemo, useRef } from "react";

export interface FilterDropdownSelectProps {
  id?: string;
  className?: string;
  placeholder: string;
  ariaLabel: string;
  options: NamedOption[];
  value: string[];
  onChange: (value: string[]) => void;
  getIconUrl?: (item: NamedOption) => string;
}

export function FilterDropdownSelect({
  id,
  className,
  placeholder,
  ariaLabel,
  options,
  value,
  onChange,
  getIconUrl,
}: FilterDropdownSelectProps) {
  const overlayRef = useRef<OverlayPanel>(null);

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.id));
  }, [options, value]);

  const toggleOption = (optId: string) => {
    if (value.includes(optId)) {
      onChange(value.filter((id) => id !== optId));
    } else {
      onChange([...value, optId]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      overlayRef.current?.toggle(event);
    }
  };

  return (
    <div className={`filter-select-wrapper ${className || ""}`.trim()}>
      <div
        id={id}
        className="activity-filter-trigger"
        // biome-ignore lint/a11y/useSemanticElements: Preserves trigger layout containing removable Chip buttons
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-label={ariaLabel}
        onClick={(e) => overlayRef.current?.toggle(e)}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`activity-filter-trigger-label${value.length === 0 ? " is-placeholder p-placeholder" : ""}`}
        >
          {value.length === 0 ? (
            <span className="is-placeholder p-placeholder">{placeholder}</span>
          ) : (
            selectedOptions.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                image={getIconUrl ? getIconUrl(item) : undefined}
                removable
                onClick={(e) => e.stopPropagation()}
                onRemove={() => {
                  toggleOption(item.id);
                  return false;
                }}
              />
            ))
          )}
        </span>
        <i className="pi pi-chevron-down" />
      </div>

      <OverlayPanel ref={overlayRef}>
        <div className="activity-filter-panel filter-select-panel">
          <div className="filter-select-header activity-filter-group">
            <span>{placeholder}</span>
          </div>
          <div className="filter-select-items">
            {options.map((item) => {
              const isChecked = value.includes(item.id);
              const icon = getIconUrl ? getIconUrl(item) : undefined;
              return (
                <label className="activity-filter-item" key={item.id}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(item.id)}
                  />
                  {icon && <img className="icon" src={icon} alt="" />}
                  <span>{item.name}</span>
                </label>
              );
            })}
          </div>
          {value.length > 0 && (
            <div className="activity-filter-footer">
              <Button
                label="Effacer"
                severity="danger"
                text
                size="small"
                icon="pi pi-times"
                onClick={() => onChange([])}
              />
            </div>
          )}
        </div>
      </OverlayPanel>
    </div>
  );
}
