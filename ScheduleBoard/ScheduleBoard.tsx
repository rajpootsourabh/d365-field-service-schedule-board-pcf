// ScheduleBoard.tsx — D365 Field Service Schedule Board PCF Control

import * as React from "react";
import { useState, useRef, useCallback, useEffect, createElement } from "react";
import type { IconType } from "react-icons";
import {
  CreateBookingPanel,
  BookingFormState,
} from "./components/CreateBookingPanel";

import {
  MdSearch,
  MdSort,
  MdRefresh,
  MdViewColumn,
  MdSettings,
  MdChevronLeft,
  MdChevronRight,
  MdArrowDropDown,
  MdList,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import {
  FaClock,
  FaCar,
  FaCheck,
  FaTimes,
  FaCoffee,
  FaWrench,
  FaPlug,
  FaBolt,
  FaCalendarAlt,
  FaCalendarPlus,
} from "react-icons/fa";
import { BsCalendar3, BsFunnel, BsThreeDots } from "react-icons/bs";

import {
  RESOURCES,
  BOOKINGS,
  REQUIREMENTS,
  OPEN_REQUIREMENTS,
  TIME_SLOTS,
  START_HOUR,
  DEFAULT_DAY_LABELS,
  WEEK_RANGES,
  HOUR_WIDTH_PX,
  DAY_WIDTH_PX,
  WEEK_WIDTH_PX,
  BOOKING_STATUSES, // Add this
  BOOKING_METHODS,
  Resource,
  Booking,
  OpenRequirement,
} from "./mockData";
import "./css/ScheduleBoard.css";
import { BottomPanel } from "./components/BottomPanel";

// ─── TS2786 fix: wrap react-icons via createElement ───────────────────────────
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}
function Ic(Icon: IconType, props: IconProps = {}): JSX.Element {
  return createElement(Icon as React.ComponentType<IconProps>, props);
}
function BookingIc(name: string, size = 11): JSX.Element {
  const p: IconProps = { size };
  switch (name) {
    case "car":
      return Ic(FaCar, p);
    case "check":
      return Ic(FaCheck, p);
    case "cancel":
      return Ic(FaTimes, p);
    case "coffee":
      return Ic(FaCoffee, p);
    case "wrench":
      return Ic(FaWrench, p);
    case "plug":
      return Ic(FaPlug, p);
    case "lightning":
      return Ic(FaBolt, p);
    default:
      return Ic(FaClock, p);
  }
}

// ─── Avatar color from name ───────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#5c7cfa",
  "#20c997",
  "#f06595",
  "#74c0fc",
  "#e64980",
  "#a9e34b",
  "#868e96",
  "#495057",
  "#a11cab",
  "#ff922b",
];
const avatarColor = (name: string): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const ResourceAvatar: React.FC<{ resource: Resource; size?: number }> = ({
  resource,
  size = 32,
}) => (
  <div
    className="sb-resource-avatar"
    style={{
      width: size,
      height: size,
      background: avatarColor(resource.name),
      fontSize: Math.round(size * 0.34),
    }}
  >
    {resource.initials}
  </div>
);

// ─── Util bar color ───────────────────────────────────────────────────────────
const utilColor = (u: number) =>
  u > 75 ? "#d13438" : u > 50 ? "#0078d4" : "#107c10";

// ─── Open Requirements Table ──────────────────────────────────────────────────
const RequirementsTable: React.FC<{
  requirements: OpenRequirement[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}> = ({ requirements, selectedIds, onToggle }) => (
  <div className="sb-req-table-wrapper">
    <table className="sb-req-table">
      <thead>
        <tr>
          <th style={{ width: 32 }}>
            <input type="checkbox" />
          </th>
          {[
            "Name",
            "From Date",
            "To Date",
            "Duration",
            "Proposed Duration",
            "Fulfilled Duration",
            "Remaining Durati...",
            "Priority",
            "Territory",
            "Time From Promi...",
            "Time To Promised",
            "Status",
            "Created On",
          ].map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {requirements.map((req) => (
          <tr
            key={req.id}
            className={selectedIds.has(req.id) ? "selected" : ""}
            onClick={() => {
              onToggle(req.id);
              // This will be handled by the parent
            }}
          >
            <td>
              <input
                type="checkbox"
                checked={selectedIds.has(req.id)}
                onChange={() => onToggle(req.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </td>
            <td>
              <span className="sb-req-link">{req.name}</span>
            </td>
            <td>{req.fromDate}</td>
            <td>{req.toDate}</td>
            <td>{req.duration}</td>
            <td>{req.proposedDuration}</td>
            <td>{req.fulfilledDuration}</td>
            <td>{req.remaining}</td>
            <td>{req.priority}</td>
            <td>{req.territory}</td>
            <td></td>
            <td></td>
            <td>
              <span className="sb-status-active">{req.status}</span>
            </td>
            <td>{req.createdOn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── VIEW TYPES ───────────────────────────────────────────────────────────────
type ViewType = "Hourly" | "Daily" | "Weekly";

interface CreateBookingPanelProps {
  resources: Resource[];
  onClose: () => void;
  onBook: (booking: BookingFormState) => void;
  preselectedResourceId?: string;
  preselectedRequirementId?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export const ScheduleBoard: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewType>("Hourly");
  const [isListView, setIsListView] = useState<boolean>(false);
  const [viewDropOpen, setViewDropOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Initial public view");
  const [selRes, setSelRes] = useState<string>("r3");
  const [selReqs, setSelReqs] = useState<Set<string>>(new Set());
  const [resourceSearch, setResourceSearch] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [bottomTab, setBottomTab] = useState<"open" | "unscheduled">("open");

  // Date range: default Mon 9/14/2020 – Sun 9/20/2020
  const [startDate, setStartDate] = useState<Date>(new Date(2020, 8, 14));
  const [endDate, setEndDate] = useState<Date>(new Date(2020, 8, 20));
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] =
    useState<boolean>(false);

  const ganttScrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hourWidth = Math.round(HOUR_WIDTH_PX * (zoomLevel / 90));
  const dayWidth = Math.round(DAY_WIDTH_PX * (zoomLevel / 90));
  const weekWidth = Math.round(WEEK_WIDTH_PX * (zoomLevel / 90));

  const [bookingPanelOpen, setBookingPanelOpen] = useState(false);
  const [createdBookings, setCreatedBookings] = useState<BookingFormState[]>(
    [],
  );
  const [preselectedReqId, setPreselectedReqId] = useState<string | undefined>(
    undefined,
  );

  // ── Filtered resources ─────────────────────────────────────────────────────
  const filtered = RESOURCES.filter((r) =>
    r.name.toLowerCase().includes(resourceSearch.toLowerCase()),
  );

  // ── Scroll sync ────────────────────────────────────────────────────────────
  const syncScroll = useCallback(() => {
    if (ganttScrollRef.current && headerScrollRef.current)
      headerScrollRef.current.scrollLeft = ganttScrollRef.current.scrollLeft;
  }, []);
  useEffect(() => {
    const el = ganttScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncScroll, { passive: true });
    return () => el.removeEventListener("scroll", syncScroll);
  }, [syncScroll]);

  // ── Close dropdown outside ─────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setViewDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Date range helpers ─────────────────────────────────────────────────────
  const fmtDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const dateRangeLabel = `${fmtDate(startDate)} - ${fmtDate(endDate)}`;

  // Build day labels from the actual date range
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buildDayList = (): { label: string; idx: number }[] => {
    const days: { label: string; idx: number }[] = [];
    const cur = new Date(startDate);
    let i = 0;
    while (cur <= endDate) {
      days.push({
        label: `${DAY_NAMES[cur.getDay()]} ${cur.getMonth() + 1}/${cur.getDate()}`,
        idx: i,
      });
      cur.setDate(cur.getDate() + 1);
      i++;
    }
    return days;
  };
  const dayList = buildDayList();
  const numDays = dayList.length;

  const handleBookingCreated = (booking: BookingFormState) => {
    setCreatedBookings((prev) => [booking, ...prev]);
    // Optional: Auto-close after 3 seconds
    setTimeout(() => {
      setBookingPanelOpen(false);
    }, 2000);
  };

  const openBookingPanel = (reqId?: string) => {
    setPreselectedReqId(reqId);
    setBookingPanelOpen(true);
  };

  // Navigate: shift date range by one period
  const shiftRange = (dir: 1 | -1) => {
    const span =
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    const ns = new Date(startDate);
    ns.setDate(ns.getDate() + dir * span);
    const ne = new Date(endDate);
    ne.setDate(ne.getDate() + dir * span);
    setStartDate(ns);
    setEndDate(ne);
  };

  const toggleReq = (id: string) => {
    setSelReqs((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    // Preselect this requirement for booking when clicking on a row
    setPreselectedReqId(id);
  };

  // ─── Booking block color class ────────────────────────────────────────────
  // Maps the color field to a CSS class consistent with existing CSS
  const blockClass = (b: Booking): string =>
    ["sb-booking-block", b.color, b.isDashed ? "dashed" : ""]
      .filter(Boolean)
      .join(" ");

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1 — HOURLY VIEW
  // Each day in the selected range gets its own labelled sub-section.
  // Within each day, booking blocks are positioned on the 7AM-6PM X-axis.
  // ══════════════════════════════════════════════════════════════════════════
  const renderHourly = () => {
    const timeBarWidth = TIME_SLOTS.length * hourWidth;

    return (
      <div className="sb-view-container">
        {/* ── Time-slot header (sticky top, syncs with scroll) ── */}
        <div className="sb-hourly-header-row">
          {/* Day-label column */}
          <div className="sb-hourly-daylabel-header">
            {dayList[0]?.label.split(" ")[0]} — {fmtDate(startDate)}
          </div>
          {/* Time slots */}
          <div className="sb-time-header-scroll-wrap" ref={headerScrollRef}>
            <div style={{ display: "flex", width: timeBarWidth }}>
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="sb-time-slot-header"
                  style={{ width: hourWidth, flexShrink: 0 }}
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Scrollable rows ── */}
        <div
          className="sb-gantt-scroll"
          ref={ganttScrollRef}
          onScroll={syncScroll}
        >
          <div style={{ width: timeBarWidth }}>
            {filtered.map((resource) => {
              // All bookings for this resource, across all days
              const allBookings = BOOKINGS.filter(
                (b) => b.resourceId === resource.id,
              );
              // For hourly view: only show dayIndex=0 (first day) as the primary view,
              // OR lay them all out day-by-day. Per D365 screenshot 1, hourly shows 1 day
              // (the start date) with time on X axis. We show ALL bookings overlaid on the
              // same timeline grouped by day — advanced: show each day as a separate row section.
              // Per screenshot 1 the hourly view shows the first day with time X axis.
              // Bookings from all days are all shown on that single timeline row per resource.
              const dayBookings = allBookings.filter((b) => b.dayIndex === 0);

              return (
                <div
                  key={resource.id}
                  className={`sb-gantt-row${selRes === resource.id ? " selected-row" : ""}`}
                  style={{ width: timeBarWidth }}
                  onClick={() => setSelRes(resource.id)}
                >
                  {TIME_SLOTS.map((_, i) => (
                    <div
                      key={i}
                      className="sb-gantt-cell"
                      style={{ width: hourWidth }}
                    />
                  ))}
                  {dayBookings.map((b) => {
                    const left = (b.startHour - START_HOUR) * hourWidth;
                    const width = Math.max(
                      (b.endHour - b.startHour) * hourWidth - 4,
                      30,
                    );
                    return (
                      <div
                        key={b.id}
                        className={blockClass(b)}
                        style={{ left, width }}
                        title={`${b.title} — ${b.durationLabel}`}
                      >
                        {b.workOrderId && !b.isDashed && (
                          <span className="sb-booking-work-order">
                            {b.workOrderId}
                          </span>
                        )}
                        <span className="sb-booking-title">{b.title}</span>
                        <div className="sb-booking-meta">
                          <span className="sb-booking-subtitle">
                            {b.type} · {b.durationLabel}
                          </span>
                          <span className="sb-booking-icon">
                            {BookingIc(b.icon, 11)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zoom row */}
        <div className="sb-zoom-row">
          <span style={{ fontSize: 11, color: "#605e5c" }}>Zoom</span>
          <input
            type="range"
            min={40}
            max={200}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="sb-zoom-slider"
          />
          <span className="sb-zoom-value">{zoomLevel}</span>
          {/* Add the toggle button here */}
          <button
            className="sb-bottom-panel-toggle"
            onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
            title={
              isBottomPanelCollapsed
                ? "Expand bottom panel"
                : "Collapse bottom panel"
            }
          >
            {isBottomPanelCollapsed
              ? Ic(MdExpandMore, { size: 18, style: { color: "#0078d4" } })
              : Ic(MdExpandLess, { size: 18, style: { color: "#0078d4" } })}
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2 — DAILY VIEW
  // Columns = one per day in the selected range.
  // Each column shows ALL bookings for that day, stacked vertically.
  // Each booking block shows: "HH:MM AM BookingTitle" (like screenshot 2)
  // There is also a summary bar at the top of each column: total hours in green/red/pink.
  // ══════════════════════════════════════════════════════════════════════════
  const renderDaily = () => {
    const totalWidth = numDays * dayWidth;

    // Compute total booked hours per resource per day
    const getHoursForDay = (resourceId: string, dayIdx: number): number => {
      return BOOKINGS.filter(
        (b) => b.resourceId === resourceId && b.dayIndex === dayIdx,
      ).reduce((sum, b) => sum + b.durationHours, 0);
    };
    const fmtHours = (h: number): string => {
      if (h === 0) return "";
      const hrs = Math.floor(h);
      const mins = Math.round((h - hrs) * 60);
      if (mins === 0) return `${hrs}h`;
      return `${hrs}h ${mins}m`;
    };
    const hoursBarColor = (h: number): string => {
      if (h === 0) return "transparent";
      if (h >= 8) return "#f4c0c0"; // red/pink for overloaded
      if (h >= 5) return "#cfe8ff"; // blue-ish
      return "#d2e9b7"; // green
    };

    return (
      <div className="sb-view-container">
        {/* Day header */}
        <div className="sb-daily-header-row">
          <div className="sb-daily-month-label">
            {startDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="sb-daily-day-headers" style={{ width: totalWidth }}>
            {dayList.map((d) => (
              <div
                key={d.idx}
                className="sb-daily-day-header"
                style={{ width: dayWidth, flexShrink: 0 }}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>

        {/* Resource rows */}
        <div className="sb-gantt-scroll" ref={ganttScrollRef}>
          <div style={{ width: totalWidth }}>
            {filtered.map((resource) => {
              const allBookings = BOOKINGS.filter(
                (b) => b.resourceId === resource.id,
              );

              return (
                <div
                  key={resource.id}
                  className={`sb-daily-resource-row${selRes === resource.id ? " selected-row" : ""}`}
                  onClick={() => setSelRes(resource.id)}
                >
                  {dayList.map((d) => {
                    const dayBookings = allBookings.filter(
                      (b) => b.dayIndex === d.idx,
                    );
                    const totalH = getHoursForDay(resource.id, d.idx);
                    const hoursLabel = fmtHours(totalH);
                    const barColor = hoursBarColor(totalH);

                    return (
                      <div
                        key={d.idx}
                        className="sb-daily-day-cell"
                        style={{ width: dayWidth }}
                      >
                        {/* Hours summary bar */}
                        {hoursLabel && (
                          <div
                            className="sb-daily-hours-bar"
                            style={{ background: barColor }}
                          >
                            {hoursLabel}
                          </div>
                        )}
                        {/* Booking chips */}
                        {dayBookings.map((b) => (
                          <div
                            key={b.id}
                            className={`sb-daily-chip ${b.color}${b.isDashed ? " dashed" : ""}`}
                            title={`${b.title} — ${b.durationLabel}`}
                          >
                            <span className="sb-daily-chip-icon">
                              {BookingIc(b.icon, 10)}
                            </span>
                            <span className="sb-daily-chip-time">
                              {b.startTimeLabel}
                            </span>
                            <span className="sb-daily-chip-title">
                              {b.workOrderId || b.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zoom row */}
        <div className="sb-zoom-row">
          <span style={{ fontSize: 11, color: "#605e5c" }}>Zoom</span>
          <input
            type="range"
            min={40}
            max={200}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="sb-zoom-slider"
          />
          <span className="sb-zoom-value">{zoomLevel}</span>
          {/* Add the toggle button here */}
          <button
            className="sb-bottom-panel-toggle"
            onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
            title={
              isBottomPanelCollapsed
                ? "Expand bottom panel"
                : "Collapse bottom panel"
            }
          >
            {isBottomPanelCollapsed
              ? Ic(MdExpandMore, { size: 18 })
              : Ic(MdExpandLess, { size: 18 })}
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 3 — WEEKLY VIEW
  // Columns = one per WEEK-RANGE in the selected span.
  // Each cell shows total hours booked that week: "21h 03m (1)"
  // Source: screenshot 3 (1/24/2021 – 6/19/2021)
  // ══════════════════════════════════════════════════════════════════════════
  const renderWeekly = () => {
    const totalWidth = WEEK_RANGES.length * weekWidth;

    // For weekly view the date range is a multi-week span.
    // We group bookings by their dayIndex into week buckets (dayIndex / 7).
    // Each resource row shows week-range columns with aggregated hours.
    const getWeekHours = (
      resourceId: string,
      weekOffset: number,
    ): { hours: number; count: number } => {
      const dayStart = weekOffset * 7;
      const dayEnd = dayStart + 6;
      const bs = BOOKINGS.filter(
        (b) =>
          b.resourceId === resourceId &&
          b.dayIndex >= dayStart &&
          b.dayIndex <= dayEnd,
      );
      return {
        hours: bs.reduce((s, b) => s + b.durationHours, 0),
        count: bs.length,
      };
    };

    const fmtWeekHours = (hours: number, count: number): string => {
      if (hours === 0) return "";
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      const mStr = String(m).padStart(2, "0");
      return `${h}h ${mStr}m (${count})`;
    };

    const weekCellColor = (hours: number): string => {
      if (hours === 0) return "transparent";
      if (hours >= 35) return "#f4c0c0";
      if (hours >= 20) return "#cfe8ff";
      return "#d2e9b7";
    };

    // Month labels above the week columns (replicate D365 monthly grouping)
    // Build month segments: February 2021, March 2021
    const monthSegments: { label: string; colSpan: number }[] = [
      { label: "January 2021", colSpan: 1 },
      { label: "February 2021", colSpan: 4 },
      { label: "March 2021", colSpan: 4 },
    ];

    return (
      <div className="sb-view-container">
        {/* Month header row */}
        <div className="sb-weekly-header-wrap">
          <div className="sb-weekly-month-header">
            {monthSegments.map((seg) => (
              <div
                key={seg.label}
                className="sb-weekly-month-seg"
                style={{ width: seg.colSpan * weekWidth }}
              >
                {seg.label}
              </div>
            ))}
          </div>
          {/* Week-range label row */}
          <div className="sb-weekly-week-header">
            {WEEK_RANGES.map((wr, i) => (
              <div
                key={i}
                className="sb-weekly-week-label"
                style={{ width: weekWidth, flexShrink: 0 }}
              >
                {wr.label}
              </div>
            ))}
          </div>
        </div>

        {/* Resource rows */}
        <div className="sb-gantt-scroll" ref={ganttScrollRef}>
          <div style={{ width: totalWidth }}>
            {filtered.map((resource) => (
              <div
                key={resource.id}
                className={`sb-weekly-resource-row${selRes === resource.id ? " selected-row" : ""}`}
                onClick={() => setSelRes(resource.id)}
              >
                {WEEK_RANGES.map((wr, i) => {
                  const { hours, count } = getWeekHours(resource.id, i);
                  const label = fmtWeekHours(hours, count);
                  const bg = weekCellColor(hours);
                  return (
                    <div
                      key={i}
                      className="sb-weekly-week-cell"
                      style={{ width: weekWidth, flexShrink: 0 }}
                    >
                      {label && (
                        <div
                          className="sb-weekly-hours-badge"
                          style={{ background: bg }}
                        >
                          {label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Zoom row */}
        <div className="sb-zoom-row">
          <span style={{ fontSize: 11, color: "#605e5c" }}>Zoom</span>
          <input
            type="range"
            min={40}
            max={200}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="sb-zoom-slider"
          />
          <span className="sb-zoom-value">{zoomLevel}</span>
          {/* Add the toggle button here */}
          <button
            className="sb-bottom-panel-toggle"
            onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
            title={
              isBottomPanelCollapsed
                ? "Expand bottom panel"
                : "Collapse bottom panel"
            }
          >
            {isBottomPanelCollapsed
              ? Ic(MdExpandMore, { size: 18 })
              : Ic(MdExpandLess, { size: 18 })}
          </button>
        </div>
      </div>
    );
  };

  // ── List View ──────────────────────────────────────────────────────────────
  const renderList = () => (
    <div className="sb-list-view-container">
      <table className="sb-list-view-table">
        <thead>
          <tr>
            {[
              "Resource",
              "Work Order",
              "Type",
              "Day",
              "Start",
              "End",
              "Duration",
              "Status",
            ].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.flatMap((resource) =>
            BOOKINGS.filter((b) => b.resourceId === resource.id).map((b) => (
              <tr key={`${resource.id}-${b.id}`}>
                <td>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <ResourceAvatar resource={resource} size={24} />
                    <span>{resource.name}</span>
                  </div>
                </td>
                <td>{b.workOrderId || "—"}</td>
                <td>{b.type}</td>
                <td>
                  {DEFAULT_DAY_LABELS[b.dayIndex] || `Day ${b.dayIndex + 1}`}
                </td>
                <td>{b.startTimeLabel}</td>
                <td>{b.durationLabel}</td>
                <td>{b.durationLabel}</td>
                <td>
                  <span
                    className={
                      b.isDashed ? "sb-status-draft" : "sb-status-scheduled"
                    }
                  >
                    {b.isDashed ? "Draft" : "Scheduled"}
                  </span>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Main view switcher ──────────────────────────────────────────────────────
  const renderMainView = () => {
    if (isListView) return renderList();
    switch (activeView) {
      case "Daily":
        return renderDaily();
      case "Weekly":
        return renderWeekly();
      default:
        return renderHourly();
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  const boardTabs = [
    "Initial public view",
    "WA Territory",
    "City of Seattle jobs",
    "Preventative maint.",
    "High priority board",
  ];

  return (
    <div className="sb-root">
      {/* ── Board Tab Bar ──────────────────────────────────────────────────── */}
      <div className="sb-tabs">
        {boardTabs.map((tab) => (
          <div
            key={tab}
            className={`sb-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
        <span className="sb-tabs-more">{Ic(BsThreeDots, { size: 16 })}</span>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="sb-toolbar">
        {/* Filters */}
        <button className="sb-filter-btn">
          {Ic(BsFunnel, { size: 14, style: { color: "#0078d4" } })}
          <span>Filters</span>
        </button>

        {/* View dropdown */}
        <div className="sb-view-dropdown-container" ref={dropdownRef}>
          <button
            className="sb-view-dropdown-btn"
            onClick={() => setViewDropOpen(!viewDropOpen)}
          >
            {Ic(BsCalendar3, { size: 13, style: { color: "#0078d4" } })}
            <span>{activeView} view</span>
            {Ic(MdArrowDropDown, { size: 18, style: { color: "#0078d4" } })}
          </button>
          {viewDropOpen && (
            <div className="sb-view-dropdown-menu">
              {(["Hourly", "Daily", "Weekly"] as ViewType[]).map((v) => (
                <div
                  key={v}
                  className={`sb-view-dropdown-item${activeView === v ? " selected" : ""}`}
                  onClick={() => {
                    setActiveView(v);
                    setViewDropOpen(false);
                    setIsListView(false);
                  }}
                >
                  <span>{v} view</span>
                  {activeView === v && (
                    <span style={{ color: "#0078d4" }}>
                      {Ic(FaCheck, { size: 11 })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List view toggle */}
        <button
          className={`sb-list-toggle-btn${isListView ? " active" : ""}`}
          onClick={() => setIsListView(!isListView)}
        >
          {Ic(MdList, { size: 20, style: { color: "#0078d4" } })}
          <span>List view</span>
        </button>

        {/* Date navigator */}
        <div className="sb-date-nav">
          <button className="sb-date-nav-btn" onClick={() => shiftRange(-1)}>
            {Ic(MdChevronLeft, { size: 20, style: { color: "#0078d4" } })}
          </button>
          <div className="sb-date-range">
            {Ic(FaCalendarAlt, { size: 12, style: { color: "#0078d4" } })}
            <span>{dateRangeLabel}</span>
          </div>
          <button className="sb-date-nav-btn" onClick={() => shiftRange(1)}>
            {Ic(MdChevronRight, { size: 20, style: { color: "#0078d4" } })}
          </button>
        </div>

        <div className="sb-toolbar-divider" />

        {/* Book */}
        <button className="sb-btn primary" onClick={() => openBookingPanel()}>
          {Ic(FaCalendarPlus, { size: 12 })}
          <span>Book</span>
        </button>

        {/* Right icon buttons */}
        <div className="sb-toolbar-right">
          <button className="sb-icon-btn">
            {Ic(MdViewColumn, { size: 18, style: { color: "#0078d4" } })}
          </button>
          <button className="sb-icon-btn">
            {Ic(MdSettings, { size: 18, style: { color: "#0078d4" } })}
          </button>
          <button className="sb-icon-btn">
            {Ic(MdRefresh, { size: 18, style: { color: "#0078d4" } })}
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="sb-body">
        {/* ── Left Resource Panel ─────────────────────────────────────────── */}
        <div className="sb-left-panel">
          {/* Search + Sort */}
          <div className="sb-resource-search">
            <div className="sb-resource-search-inner">
              {Ic(MdSearch, {
                size: 18,
                style: { color: "#0078d4", flexShrink: 0 },
              })}
              <input
                type="text"
                placeholder="Search"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>
            <button className="sb-resource-sort-btn">
              {Ic(MdSort, { size: 16 })}
            </button>
          </div>

          {/* Resource rows */}
          <div className="sb-resource-list">
            {filtered.map((resource) => (
              <div
                key={resource.id}
                className={`sb-resource-row${selRes === resource.id ? " selected" : ""}`}
                onClick={() => setSelRes(resource.id)}
              >
                <ResourceAvatar resource={resource} />
                <div className="sb-resource-info">
                  <div className="sb-resource-name">{resource.name}</div>
                  <div className="sb-resource-utilization">
                    {resource.utilization}% ({resource.bookedHours})
                  </div>
                  <div className="sb-resource-util-bar">
                    <div
                      className="sb-resource-util-fill"
                      style={{
                        width: `${resource.utilization}%`,
                        background: utilColor(resource.utilization),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggest row */}
          <div className="sb-suggest-row">
            <button className="sb-suggest-btn">
              {Ic(FaCalendarAlt, { size: 11 })}
              <span>Suggest resources (Preview)</span>
            </button>
          </div>

          {/* Pagination */}
          <div className="sb-resource-footer">
            <button className="sb-page-btn" disabled>
              {Ic(MdChevronLeft, { size: 18 })}
            </button>
            <span>
              1 – {filtered.length} of {RESOURCES.length}
            </span>
            <button className="sb-page-btn">
              {Ic(MdChevronRight, { size: 18 })}
            </button>
          </div>
        </div>

        {/* ── Gantt / View Area ─────────────────────────────────────────────── */}
        <div className="sb-gantt-wrapper">{renderMainView()}</div>

        {/* Create Booking Panel - slides in from right */}
        {bookingPanelOpen && (
          <CreateBookingPanel
            resources={RESOURCES}
            onClose={() => setBookingPanelOpen(false)}
            onBook={handleBookingCreated}
            preselectedResourceId={selRes}
            preselectedRequirementId={preselectedReqId}
          />
        )}
      </div>

      {/* ── Bottom Panel ─────────────────────────────────────────────────────── */}
      {/* ── Bottom Panel ─────────────────────────────────────────────────────── */}
      <BottomPanel
        requirements={OPEN_REQUIREMENTS}
        selectedIds={selReqs}
        onToggle={toggleReq}
        onRefresh={() => {
          console.log("Refresh bottom panel data");
          // Add your refresh logic here
        }}
        onSearch={(searchTerm) => {
          console.log("Search:", searchTerm);
          // Add your search logic here
        }}
        isCollapsed={isBottomPanelCollapsed}
      />
    </div>
  );
};

export default ScheduleBoard;
