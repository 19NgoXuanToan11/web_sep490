import React from "react";
import styles from "./Calendar.module.scss";
import { buildTimeSlots, minutesBetween } from "./timeEngine";
import type { CalendarEvent } from "./timeEngine";
import EventCard from "./EventCard";

interface Props {
    date: Date;
    events: CalendarEvent[];
    workHours?: { start: string; end: string };
    slotMinutes?: number;
    onEventClick?: (raw?: any) => void;
}

export const DayView: React.FC<Props> = ({ date, events, workHours = { start: "08:00", end: "18:00" }, slotMinutes = 30, onEventClick }) => {
    const slots = buildTimeSlots(workHours.start, workHours.end, slotMinutes);
    const isToday = new Date().toDateString() === date.toDateString();
    return (
        <div style={{ display: "flex", gap: 12 }} className={isToday ? styles.today : ""}>
            <div style={{ width: 80 }}>
                {slots.map((s, i) => (
                    <div key={i} className={styles.hourSlot}>
                        {s.getHours().toString().padStart(2, "0")}:00
                    </div>
                ))}
            </div>
            <div className={styles.timeGrid}>
                {slots.map((_, i) => (
                    <div key={i} className={styles.hourRow}>
                        <div className={styles.gridLine} />
                    </div>
                ))}
                {events.map((ev) => {
                    const top = (minutesBetween(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0), ev.start as Date) / 60) * 48;
                    const height = (minutesBetween(ev.start as Date, ev.end as Date) / 60) * 48;
                    return (
                        <div key={ev.id} style={{ position: "absolute", left: 8, right: 8, top, height, zIndex: 5 }}>
                            <EventCard event={ev} onClick={onEventClick} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DayView;


