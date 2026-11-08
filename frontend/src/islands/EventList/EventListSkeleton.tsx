import { Skeleton } from "primereact/skeleton";

export function EventListSkeleton() {
  return (
    <div className="tabulator-row tabulator-selectable">
      <div className="row collectives-list--item">
        <div className="section collectives-list--item--photo">
          <Skeleton width="100%" height="100%" />
        </div>
        <div className="section collectives-list--item--details">
          {/* Card Header */}
          <div className="collectives-list--item--details-heading">
            <div className="no_mobile collectives-list--item--details-date">
              <Skeleton width="180px" height="1.2rem" />
            </div>
            <div>
              <Skeleton width="60%" height="1.3rem" />
            </div>
          </div>

          {/* Card Bottom Left */}
          <div className="collectives-list--item--details-bottom-left">
            <div className="heading-3 no_mobile collectives-list--item--details-activity-type">
              <Skeleton shape="circle" width="65px" height="65px" />
            </div>

            <div className="mobile collectives-list--item--details-date">
              <Skeleton width="55%" height="0.85rem" />
            </div>
            <div className="leader collectives-list--item--details-leader">
              <Skeleton width="35%" height="0.85rem" />
            </div>
          </div>

          {/* Bottom Right */}
          <div className="collectives-list--item--details-bottom-right">
            <div className="collectives-list--item--details-slots">
              <div className="aligned-flex">
                <div className="collectives-list--item--details-slots-bar">
                  <Skeleton
                    className="collectives-list--item--details-slots-bar-filler"
                    height="10px"
                  />
                </div>
                <div className="collectives-list--item--details-slots-count">
                  <Skeleton width="30px" height="0.85rem" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
