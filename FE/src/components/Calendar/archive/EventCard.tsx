import React from "react";
import styles from "./Calendar.module.scss";
import type { CalendarEvent } from "./timeEngine";

interface Props {
  event: CalendarEvent;
  onClick?: (raw?: any) => void;
}

export const EventCard: React.FC<Props> = ({ event, onClick }) => {
  const bg = event.color ?? "#fee2e2";
  const raw = event.raw;

  return (
    <div
      className={styles.eventCard}
      style={{ background: bg, borderColor: "rgba(0,0,0,0.04)", cursor: onClick ? "pointer" : "default" }}
      title={event.title}
      onClick={() => onClick && onClick(raw)}
    >
      <div style={{ flex: 1 }}>
        <div className={styles.eventTitle}>
          {event.title}
        </div>
      </div>
    </div>
  );
};

export default EventCard;


