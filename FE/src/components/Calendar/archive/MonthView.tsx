import React from "react";
import styles from "./Calendar.module.scss";
import { getMonthMatrix } from "./timeEngine";
import EventCard from "./EventCard";

interface Props {
    anchorDate: Date;
    events: any[];
    onEventClick?: (raw?: any) => void;
}

export const MonthView: React.FC<Props> = ({ anchorDate, events, onEventClick }) => {
    const matrix = getMonthMatrix(anchorDate);
    return (
        <div className={styles.monthGrid}>
            {matrix.flat().map((d, idx) => {
                const isSameMonth = d.getMonth() === anchorDate.getMonth() && d.getFullYear() === anchorDate.getFullYear();
                const dayStartTs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                const dayEvents = isSameMonth
                    ? events.filter((e) => {
                        if (!e.start) return false;
                        const evStart = new Date(e.start);
                        const evEnd = e.end ? new Date(e.end) : evStart;
                        const evStartDayTs = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate()).getTime();
                        const evEndDayTs = new Date(evEnd.getFullYear(), evEnd.getMonth(), evEnd.getDate()).getTime();
                        return evStartDayTs <= dayStartTs && dayStartTs <= evEndDayTs;
                    })
                    : [];
                const isToday = isSameMonth && new Date().toDateString() === d.toDateString();
                return (
                    <div
                        key={idx}
                        className={`${styles.monthCell} ${isToday ? styles.today : ""} ${!isSameMonth ? styles.otherMonth : ""}`}
                    >
                        <div className={styles.monthCellHeader}>
                            <div>{isSameMonth ? d.getDate() : null}</div>
                        </div>
                        <div className={styles.chipList}>
                            {isSameMonth &&
                                dayEvents.slice(0, 3).map((ev) => (
                                    <EventCard key={ev.id} event={ev} onClick={onEventClick} />
                                ))}
                            {isSameMonth && dayEvents.length > 3 && (
                                <button className={styles.moreBtn}>+{dayEvents.length - 3} thêm</button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MonthView;


