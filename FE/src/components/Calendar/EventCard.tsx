import React from "react";
import styles from "./Calendar.module.scss";
import type { CalendarEvent } from "./timeEngine";
import { formatTimeRange } from "./timeEngine";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";

interface Props {
  event: CalendarEvent;
  onClick?: (raw?: any) => void;
}

export const EventCard: React.FC<Props> = ({ event, onClick }) => {
  const bg = event.color ?? "#fee2e2";
  const raw = event.raw;
  const startLabel = raw?.startDate ? format(parseISO(raw.startDate), "dd/MM/yyyy") : (event.start ? format(event.start, "dd/MM/yyyy") : "");
  const endLabel = raw?.endDate ? format(parseISO(raw.endDate), "dd/MM/yyyy") : (event.end ? format(event.end, "dd/MM/yyyy") : "");
  const timeLabel = startLabel && endLabel ? `${startLabel} → ${endLabel}` : formatTimeRange(event.start, event.end);
  return (
    <div
      className={styles.eventCard}
      style={{ background: bg, borderColor: "rgba(0,0,0,0.04)", cursor: onClick ? "pointer" : "default" }}
      title={event.title}
      onClick={() => onClick && onClick(raw)}
    >
      <div style={{ flex: 1 }}>
        <div className={styles.eventTitle}>{event.title}</div>
        <div className={styles.eventTime}>{timeLabel}</div>
      </div>
    </div>
  );
};

export default EventCard;


