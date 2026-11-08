import { useCallback, useEffect, useRef, useState } from "react";

export interface DateScrubberItem {
  key: string;
  label: string;
  count: number;
}

export interface EventDateScrubberProps {
  dates: DateScrubberItem[];
  activeDateKey: string | null;
  onScrubToDate: (dateKey: string, index: number) => void;
}

export function EventDateScrubber({ dates, activeDateKey, onScrubToDate }: EventDateScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show callout badge when user scrolls, auto-hide after 1.2s inactivity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const resolvedActiveIndex = useCallback(() => {
    if (scrubIndex !== null) {
      return scrubIndex;
    }
    const idx = dates.findIndex((d) => d.key === activeDateKey);
    return idx >= 0 ? idx : 0;
  }, [activeDateKey, dates, scrubIndex]);

  const currentIndex = resolvedActiveIndex();
  const currentItem = dates[currentIndex] || dates[0];
  const thumbPercent = dates.length > 1 ? (currentIndex / (dates.length - 1)) * 100 : 0;

  const updateScrubFromClientY = useCallback(
    (clientY: number) => {
      if (!Number.isFinite(clientY)) {
        return;
      }
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || dates.length === 0) {
        return;
      }
      const clampedY = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const percent = rect.height > 0 ? clampedY / rect.height : 0;
      const targetIdx = Math.min(
        dates.length - 1,
        Math.max(0, Math.round(percent * (dates.length - 1))),
      );
      const targetDate = dates[targetIdx];
      if (targetDate) {
        setScrubIndex(targetIdx);
        onScrubToDate(targetDate.key, targetIdx);
      }
    },
    [dates, onScrubToDate],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof e.currentTarget.setPointerCapture === "function") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore capture errors
      }
    }
    setIsScrubbing(true);
    updateScrubFromClientY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) {
      return;
    }
    updateScrubFromClientY(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      setScrubIndex(null);
      if (typeof e.currentTarget.releasePointerCapture === "function") {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore capture errors
        }
      }
    }
  };

  // Do not render scrubber if there are fewer than 2 dates
  if (dates.length < 2) {
    return null;
  }

  const showCallout = (isScrubbing || isScrolling || isHovered) && Boolean(currentItem);

  return (
    <nav
      className={`event-date-scrubber${isScrubbing ? " is-scrubbing" : ""}`}
      aria-label="Navigation rapide par date"
    >
      {showCallout && currentItem && (
        <div
          className="date-scrubber-callout"
          style={{ top: `${thumbPercent}%` }}
          aria-live="polite"
        >
          <span className="callout-date">{currentItem.label}</span>
          <span className="callout-count">
            {currentItem.count} collective{currentItem.count > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div
        ref={trackRef}
        className="date-scrubber-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <div className="date-scrubber-line" />

        <div className="date-scrubber-ticks">
          {dates.map((d, idx) => (
            <span
              key={d.key}
              className={`date-scrubber-tick${idx === currentIndex ? " is-active" : ""}`}
              style={{
                top: `${(idx / Math.max(1, dates.length - 1)) * 100}%`,
              }}
              title={d.label}
            />
          ))}
        </div>

        <div
          className="date-scrubber-thumb"
          style={{ top: `${thumbPercent}%` }}
          aria-label={`Position de défilement : ${currentItem?.label || ""}`}
        >
          <i className="pi pi-calendar" />
        </div>
      </div>
    </nav>
  );
}
