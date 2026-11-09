import type { EventItem } from "@/types/event";

export interface EventListItemProps {
  eventItem: EventItem;
  eventStatusLabels: Record<string, string>;
}

const CANCELLED_STATUS_VALUE = 2;

function getFreeSlotPercent(event: EventItem): string {
  if (!event.num_slots || event.num_slots <= 0) {
    return "0%";
  }
  return `${100 - (event.free_slots / event.num_slots) * 100}%`;
}

function isCancelledStatus(status: number | string): boolean {
  return status === CANCELLED_STATUS_VALUE || status === "Cancelled";
}

export function EventListItem({ eventItem, eventStatusLabels }: EventListItemProps) {
  const cancelled = isCancelledStatus(eventItem.status);
  const statusLabel = eventStatusLabels[String(eventItem.status)] || "";
  const slotPercent = getFreeSlotPercent(eventItem);

  return (
    <div className="tabulator-row tabulator-selectable">
      <a className="row collectives-list--item" href={eventItem.view_uri}>
        <div className="section collectives-list--item--photo">
          <img src={eventItem.photo_uri} alt="" />
        </div>
        <div className="section collectives-list--item--details">
          {/* Card Header */}
          <div className="collectives-list--item--details-heading">
            <div className="no_mobile collectives-list--item--details-date">
              {eventItem.formated_datetime_range}
            </div>

            <div className="collectives-list--item--details-keywords">
              {!eventItem.is_confirmed && (
                <span className={`event-status-badge event-status-${eventItem.status}`}>
                  {statusLabel}
                </span>
              )}

              {eventItem.has_free_waiting_slots &&
                !eventItem.has_free_online_slots &&
                !cancelled && (
                  <span className="event-status-badge event-status-waiting-list">
                    Liste d&apos;attente
                  </span>
                )}

              {!eventItem.has_free_slots && !eventItem.has_free_waiting_slots && !cancelled && (
                <span className="event-status-badge event-status-full">Complet</span>
              )}
            </div>

            <div>{eventItem.title}</div>
          </div>

          {/* Card Bottom Left */}
          <div className="collectives-list--item--details-bottom-left">
            <div className="heading-3 no_mobile collectives-list--item--details-activity-type">
              {eventItem.activity_types.map((type) => (
                <img
                  key={type.id || type.icon}
                  src={`/static/caf/icon/${type.icon}.svg`}
                  alt={type.name}
                  title={type.name}
                />
              ))}
            </div>

            <div className="mobile collectives-list--item--details-date">
              {eventItem.formated_datetime_range}
            </div>
            <div className="leader collectives-list--item--details-leader">
              {eventItem.leaders.slice(0, 2).map((leader, index) => (
                <span key={leader.id}>
                  {leader.full_name}
                  {index < eventItem.leaders.length && <br />}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Right */}
          <div className="collectives-list--item--details-bottom-right">
            {/* Tags */}
            <div className="collectives-list--item--details-tags">
              {eventItem.activity_types.map((type) => (
                <span key={type.id || type.icon} className="item inline-mobile aligned-flex-inline">
                  <img
                    width="30px"
                    src={`/static/caf/icon/${type.icon}.svg`}
                    alt={type.short || type.name}
                    title={type.short || type.name}
                  />
                  <span>{type.name}</span>
                </span>
              ))}

              {eventItem.event_type && (
                <span className="item aligned-flex-inline">
                  <img
                    src={`/static/caf/icon/${eventItem.event_type.short}.svg`}
                    width="30px"
                    alt={eventItem.event_type.name}
                    title={eventItem.event_type.name}
                  />
                  <span>{eventItem.event_type.name}</span>
                </span>
              )}

              {eventItem.tags.map((tag) => (
                <span key={tag.short} className="item aligned-flex-inline">
                  <img
                    src={`/static/caf/icon/${tag.short}.svg`}
                    width="30px"
                    alt={tag.name}
                    title={tag.name}
                  />
                  <span>{tag.name}</span>
                </span>
              ))}
            </div>

            {/* Slots */}
            <div className="collectives-list--item--details-slots">
              <div className="aligned-flex">
                <div className="collectives-list--item--details-slots-bar">
                  <div
                    className="collectives-list--item--details-slots-bar-filler"
                    style={{ width: slotPercent }}
                  />
                </div>
                <div className="collectives-list--item--details-slots-count">
                  {Math.max(0, eventItem.occupied_slots)}/{eventItem.num_slots}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
