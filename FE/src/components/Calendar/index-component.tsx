import React, { useMemo, useState } from "react";
import styles from "./Calendar.module.scss";
import Header from "./Header";
import MonthView from "./MonthView";
import { defaultEngineState } from "./timeEngine";
import type { CalendarEvent } from "./timeEngine";
import { format } from "date-fns";

interface Props {
  events?: CalendarEvent[];
  onEventClick?: (raw?: any) => void;
}

export const CalendarShell: React.FC<Props> = ({ events = [], onEventClick }) => {
  const [state, setState] = useState(defaultEngineState);

  const label = useMemo(() => {
    return `${format(state.anchorDate, "LLLL yyyy")}`;
  }, [state.anchorDate]);

  const goto = (dir: number) => {
    const next = new Date(state.anchorDate);
    next.setMonth(next.getMonth() + dir);
    setState({ ...state, anchorDate: next });
  };

  const onToday = () => setState({ ...state, anchorDate: new Date() });

  return (
    <div className={styles.root}>
      <Header onPrev={() => goto(-1)} onNext={() => goto(1)} onToday={onToday} label={label} />
      <div className={styles.body}>
        <MonthView anchorDate={state.anchorDate} events={events} onEventClick={onEventClick} />
      </div>
    </div>
  );
};

export default CalendarShell;


