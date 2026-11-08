import { Skeleton } from "primereact/skeleton";

export function EventListSkeleton() {
  return (
    <div className="tabulator-row tabulator-selectable">
      <div className="row collectives-list--item">
        <div className="section collectives-list--item--photo">
          <Skeleton width="277.5px" height="185px" />
        </div>
        <div className="section collectives-list--item--details">
          {/* Card Header */}
          <div className="collectives-list--item--details-heading">
            <div className="no_mobile collectives-list--item--details-date">
              <Skeleton />
            </div>
            <div>
              <Skeleton />
            </div>
          </div>

          {/* Card Bottom Left */}
          <div className="collectives-list--item--details-bottom-left">
            <div className="heading-3 no_mobile collectives-list--item--details-activity-type">
              <Skeleton shape="circle" width="65px" height="65px" />
            </div>

            <div className="mobile collectives-list--item--details-date">
              <Skeleton />
            </div>
            <div className="leader collectives-list--item--details-leader">
              <Skeleton />
            </div>
          </div>

          {/* Bottom Right */}
          <div className="collectives-list--item--details-bottom-right">
            <div className="collectives-list--item--details-slots">
              <div className="aligned-flex">
                <div className="collectives-list--item--details-slots-bar">
                  <Skeleton className="collectives-list--item--details-slots-bar-filler" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
