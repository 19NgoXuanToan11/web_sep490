import React from "react";
import styles from "./Calendar.module.scss";
import { getWeekDays, buildTimeSlots, minutesBetween } from "./timeEngine";
import type { CalendarEvent } from "./timeEngine";
import EventCard from "./EventCard";

interface Props {
  anchorDate: Date;
  events: CalendarEvent[];
  workHours?: { start: string; end: string };
  slotMinutes?: number;
  onEventClick?: (raw?: any) => void;
}

export const WeekView: React.FC<Props> = ({ anchorDate, events, workHours = { start: "08:00", end: "18:00" }, slotMinutes = 30, onEventClick }) => {
  const days = getWeekDays(anchorDate, 1);
  const slots = buildTimeSlots(workHours.start, workHours.end, slotMinutes);
  return (
    <div className={styles.weekGrid}>
      <div className={styles.hoursCol}>
        {slots.map((s, i) => (
          <div className={styles.hourSlot} key={i}>
            {s.getHours().toString().padStart(2, "0")}:00
          </div>
        ))}
      </div>
      {days.map((d) => {
        const isToday = new Date().toDateString() === d.toDateString();
        return (
          <div className={`${styles.dayColumn} ${isToday ? styles.today : ""}`} key={d.toISOString()}>
            {slots.map((_, i) => (
              <div key={i} style={{ position: "relative", height: 48 }} className="slot">
                <div className={styles.gridLine} style={{ top: i * 48 }} />
              </div>
            ))}
            {events
              .filter((ev) => ev.start && new Date(ev.start).toDateString() === d.toDateString())
              .map((ev) => {
                const top = (minutesBetween(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0), ev.start as Date) / 60) * 48;
                const height = (minutesBetween(ev.start as Date, ev.end as Date) / 60) * 48;
                return (
                  <div key={ev.id} style={{ position: "absolute", top, left: 6, right: 6, height, zIndex: 5 }}>
                    <EventCard event={ev} onClick={onEventClick} />
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

export default WeekView;


