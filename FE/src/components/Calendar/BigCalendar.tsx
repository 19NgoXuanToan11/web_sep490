import React, { useCallback, useState } from "react";
import { Calendar as RBC, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import Header from "./archive/Header";
import { vi } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

interface Props {
  events?: Array<{
    id?: string | number;
    title?: string;
    start?: Date | string | null;
    end?: Date | string | null;
    color?: string;
    participants?: any[];
    raw?: any;
  }>;
  onEventClick?: (raw?: any) => void;
  onDayClick?: (date: Date, events: any[]) => void;
  onEventMenuAction?: (action: string, raw?: any) => void;
}

const locales: Record<string, any> = {
  "vi-VN": vi,
  vi: vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const toRbcEvent = (e: any) => {
  const start = e?.start instanceof Date ? e.start : e?.start ? new Date(e.start) : null;
  const rawEnd = e?.end instanceof Date ? e.end : e?.end ? new Date(e.end) : start;

  const isAllDay = e?.allDay ?? true;
  const end = rawEnd
    ? isAllDay
      ? addDays(
        new Date(rawEnd.getFullYear(), rawEnd.getMonth(), rawEnd.getDate()),
        1
      )
      : rawEnd
    : undefined;

  return {
    id: e.id ?? `${start?.getTime() ?? Math.random()}`,
    title: e.title ?? e.name ?? "Event",
    start: start ?? undefined,
    end: end ?? undefined,
    allDay: isAllDay,
    color: e.color ?? undefined,
    raw: e.raw ?? e,
  };
};

const BigCalendar: React.FC<Props> = ({ events = [], onEventClick, onDayClick, onEventMenuAction }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const mapped = (events || []).map(toRbcEvent).filter((ev) => !!ev.start);

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  const messages = {
    date: "Ngày",
    time: "Thời gian",
    event: "Sự kiện",
    allDay: "Cả ngày",
    previous: "Trước",
    next: "Sau",
    today: "Hôm nay",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    agenda: "Lịch",
    showMore: (total: number) => `+${total} thêm`,
  };

  const formats = {
    weekdayFormat: (date: Date) =>
      capitalize(date.toLocaleDateString("vi-VN", { weekday: "long" })),
    monthHeaderFormat: (date: Date) =>
      capitalize(date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })),
    dayHeaderFormat: (date: Date) =>
      capitalize(
        date.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      ),
    dayFormat: (date: Date) => date.getDate().toString(),
  };

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() - 1);
      return nd;
    });
  }, []);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() + 1);
      return nd;
    });
  }, []);

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleSelectEvent = useCallback(
    (event: any) => {
      onEventClick && onEventClick(event.raw ?? event);
    },
    [onEventClick]
  );

  const CustomEvent = (props: any) => {
    const ev = props.event || props.eventData || {}
    const title = ev.title ?? ''
    const raw = ev.raw ?? ev
    const isContinuation = !!props.continuesPrior

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
          {!isContinuation ? title : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => { e.stopPropagation() }} className="p-1 rounded hover:bg-muted/50">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {raw && (raw.farmActivitiesId !== undefined && raw.farmActivitiesId !== null) ? (
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="w-full block text-left px-4 py-2 rounded-md hover:bg-muted/50 active:bg-muted/60 focus:outline-none cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventMenuAction && onEventMenuAction('editActivity', raw)
                  }}
                >
                  Chỉnh sửa hoạt động nông trại
                </button>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full block text-left px-4 py-2 rounded-md hover:bg-muted/50 active:bg-muted/60 focus:outline-none cursor-pointer text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  const ok = window.confirm('Bạn có chắc chắn muốn vô hiệu hóa lịch này?')
                  if (!ok) return
                  onEventMenuAction && onEventMenuAction('deactivate', raw)
                }}
              >
                Vô hiệu hóa lịch
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const handleShowMore = useCallback(
    (eventsList: any[], date: Date) => {
      if (onDayClick) {
        onDayClick(date, (eventsList || []).map((e) => e.raw ?? e));
      }
    },
    [onDayClick]
  );

  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.color || "#F59E0B";
    const style: React.CSSProperties = {
      backgroundColor,
      borderRadius: "6px",
      color: "#fff",
      border: "1px solid rgba(0,0,0,0.12)",
      padding: "2px 6px",
      fontSize: "13px",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    };
    return { style };
  };

  return (
    <div style={{ width: "100%" }}>
      <Header
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        label={capitalize(currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }))}
      />

      <RBC
        localizer={localizer}
        events={mapped}
        date={currentDate}
        messages={messages}
        formats={formats as any}
        onNavigate={handleNavigate}
        toolbar={false}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={{ month: true }}
        onSelectEvent={handleSelectEvent}
        onShowMore={handleShowMore}
        popup={false}
        selectable={false}
        eventPropGetter={eventStyleGetter}
        components={{ event: CustomEvent }}
        style={{ minHeight: 500 }}
      />
    </div>
  );
};

export default BigCalendar;
