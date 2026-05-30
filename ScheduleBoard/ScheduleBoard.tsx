// ScheduleBoard.tsx — D365 Field Service Schedule Board PCF Control
// Updated: View dropdown (Hourly/Daily/Weekly/Monthly) + List View as separate toggle
// Removed: Suggest resources and Book resources preview buttons
// Updated: Chevron icons for pagination

import * as React from "react";
import { useState, useRef, useCallback, useEffect, createElement } from "react";
import type { IconType } from "react-icons";

// ── react-icons imports ───────────────────────────────────────────────────────
import {
  MdSearch,
  MdSort,
  MdRefresh,
  MdViewColumn,
  MdSettings,
  MdChevronLeft,
  MdChevronRight,
  MdAutoFixHigh,
  MdList,
  MdArrowDropDown,
  MdViewDay,
  MdViewWeek,
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
  FaCalendarCheck,
  FaRegCalendarCheck,
} from "react-icons/fa";
import { BsCalendarRange, BsFunnel, BsThreeDots } from "react-icons/bs";

import {
  RESOURCES,
  BOOKINGS,
  OPEN_REQUIREMENTS,
  TIME_SLOTS,
  START_HOUR,
  HOUR_WIDTH_PX,
  Resource,
  Booking,
  OpenRequirement,
} from "./mockData";
import "./css/ScheduleBoard.css";

// ─── TS2786 Fix ───────────────────────────────────────────────────────────────
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}
function Ic(Icon: IconType, props: IconProps = {}): JSX.Element {
  return createElement(Icon as React.ComponentType<IconProps>, props);
}

// ─── Booking icon resolver ────────────────────────────────────────────────────
function bookingIcon(name: string, size = 11): JSX.Element {
  const p: IconProps = { size };
  switch (name) {
    case "clock":
      return Ic(FaClock, p);
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

// ─── Generate avatar color from resource name ──────────────────────────────
const getResourceColor = (name: string): string => {
  // Simple hash function to generate consistent colors from a name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Array of pleasant colors (D365 style palette)
  const colors = [
    "#5c7cfa", // Blue
    "#20c997", // Green
    "#f06595", // Pink
    "#74c0fc", // Light Blue
    "#e64980", // Rose
    "#a9e34b", // Lime
    "#868e96", // Gray
    "#495057", // Dark Gray
    "#a11cab", // Purple
    "#ff922b", // Orange
    "#339af0", // Sky Blue
    "#51cf66", // Emerald
    "#fcc419", // Yellow
    "#845ef7", // Violet
    "#ff6b6b", // Red
    "#22b8cf", // Cyan
  ];

  // Use the hash to pick a color consistently
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const ResourceAvatar: React.FC<{ resource: Resource; size?: number }> = ({
  resource,
  size = 32,
}) => {
  // Generate color dynamically from resource name
  const avatarColor = getResourceColor(resource.name);

  return (
    <div
      className="sb-resource-avatar"
      style={{
        width: size,
        height: size,
        background: avatarColor,
        fontSize: size * 0.34,
      }}
    >
      {resource.initials}
    </div>
  );
};

// ─── Booking Block ────────────────────────────────────────────────────────────
const BookingBlock: React.FC<{
  booking: Booking;
  hourWidth: number;
  startHour: number;
}> = ({ booking, hourWidth, startHour }) => {
  const left = (booking.startHour - startHour) * hourWidth;
  const width = Math.max(
    (booking.endHour - booking.startHour) * hourWidth - 4,
    30,
  );
  const cls = [
    "sb-booking-block",
    booking.color,
    booking.isDashed ? "dashed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{ left, width }}
      title={`${booking.title} — ${booking.durationLabel}`}
    >
      {booking.workOrderId && !booking.isDashed && (
        <span className="sb-booking-work-order">{booking.workOrderId}</span>
      )}
      <span className="sb-booking-title">{booking.title}</span>
      <div className="sb-booking-meta">
        <span className="sb-booking-subtitle">
          {booking.type} · {booking.durationLabel}
        </span>
        <span className="sb-booking-icon">{bookingIcon(booking.icon, 11)}</span>
      </div>
    </div>
  );
};

// ─── Gantt Row ────────────────────────────────────────────────────────────────
const GanttRow: React.FC<{
  resource: Resource;
  bookings: Booking[];
  timeSlots: string[];
  hourWidth: number;
  startHour: number;
  isSelected: boolean;
}> = ({ resource, bookings, timeSlots, hourWidth, startHour, isSelected }) => (
  <div
    className={`sb-gantt-row${isSelected ? " selected-row" : ""}`}
    style={{ width: timeSlots.length * hourWidth }}
  >
    {timeSlots.map((_, i) => (
      <div key={i} className="sb-gantt-cell" style={{ width: hourWidth }} />
    ))}
    {bookings.map((b) => (
      <BookingBlock
        key={b.id}
        booking={b}
        hourWidth={hourWidth}
        startHour={startHour}
      />
    ))}
  </div>
);

// ─── Requirements Table ───────────────────────────────────────────────────────
const RequirementsTable: React.FC<{
  requirements: OpenRequirement[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}> = ({ requirements, selectedIds, onToggle }) => (
  <div className="sb-req-table-wrapper">
    <table className="sb-req-table">
      <thead>
        <tr>
          <th>
            <input type="checkbox" style={{ cursor: "pointer" }} />
          </th>
          {[
            "Name",
            "From Date",
            "To Date",
            "Duration",
            "Fulfilled Duration",
            "Remaining Duration",
            "Priority",
            "Territory",
            "Status",
          ].map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {requirements.map((req) => (
          <tr
            key={req.id}
            className={selectedIds.has(req.id) ? "selected" : ""}
            onClick={() => onToggle(req.id)}
          >
            <td>
              <input
                type="checkbox"
                checked={selectedIds.has(req.id)}
                onChange={() => onToggle(req.id)}
                style={{ cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
              />
            </td>
            <td>
              <span className="sb-req-link">{req.name}</span>
            </td>
            <td>{req.fromDate}</td>
            <td>{req.toDate}</td>
            <td>{req.duration}</td>
            <td>{req.fulfilled}</td>
            <td>{req.remaining}</td>
            <td>{req.priority}</td>
            <td>{req.territory}</td>
            <td className="sb-status-active">{req.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const ScheduleBoard: React.FC = () => {
  const [selectedResourceId, setSelectedResourceId] = useState<string>("r3");
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<
    "Hourly View" | "Daily View" | "Weekly View" | "Monthly View"
  >("Hourly View");
  const [isListView, setIsListView] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<
    "open" | "unscheduled"
  >("open");
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [resourceSearch, setResourceSearch] = useState<string>("");
  const [viewDropdownOpen, setViewDropdownOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Initial public view");

  // ── Date range state ──────────────────────────────────────────────────
  const [startDate, setStartDate] = useState<Date>(new Date(2020, 8, 14)); // September 14, 2020
  const [endDate, setEndDate] = useState<Date>(new Date(2020, 8, 20)); // September 20, 2020

  const boardTabs: string[] = [
    "Initial public view",
    "WA Territory",
    "City of Seattle jobs",
    "Preventative maint.",
    "High priority board",
  ];

  const ganttScrollRef = useRef<HTMLDivElement>(null);
  const timeHeaderRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hourWidth = Math.round(HOUR_WIDTH_PX * (zoomLevel / 90));
  const totalWidth = TIME_SLOTS.length * hourWidth;

  // ─── Date navigation functions ──────────────────────────────────────
  const formatDateRange = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
  };

  const handlePrevDate = () => {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    // Move back by 7 days
    newStart.setDate(newStart.getDate() - 7);
    newEnd.setDate(newEnd.getDate() - 7);
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleNextDate = () => {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    // Move forward by 7 days
    newStart.setDate(newStart.getDate() + 7);
    newEnd.setDate(newEnd.getDate() + 7);
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleGanttScroll = useCallback(() => {
    if (ganttScrollRef.current && timeHeaderRef.current) {
      timeHeaderRef.current.scrollLeft = ganttScrollRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const el = ganttScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleGanttScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleGanttScroll);
  }, [handleGanttScroll]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setViewDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleReq = (id: string) => {
    setSelectedReqIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredResources = RESOURCES.filter((r) =>
    r.name.toLowerCase().includes(resourceSearch.toLowerCase()),
  );

  const viewOptions: Array<
    "Hourly View" | "Daily View" | "Weekly View" | "Monthly View"
  > = ["Hourly View", "Daily View", "Weekly View", "Monthly View"];

  

  return (
    <div className="sb-root">
      {/* ── Board Tab bar ─────────────────────────────────────────────── */}
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

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="sb-toolbar">
        <button className="sb-filter-btn">
          {Ic(BsFunnel, { size: 15, style: { color: "#0078d4" } })}
          <span>Filters</span>
        </button>
        <div className="sb-toolbar-divider" />
        {/* ── View Dropdown (Hourly/Daily/Weekly/Monthly) ────────────── */}
        <div className="sb-view-dropdown-container" ref={dropdownRef}>
          <button
            className="sb-view-dropdown-btn"
            onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              {Ic(FaRegCalendarCheck, {
                size: 14,
                style: { color: "#0078d4" },
              })}
              <span style={{ marginLeft: 6 }}>{activeView}</span>
            </span>
            <span
              style={{ display: "flex", alignItems: "center", marginLeft: 6 }}
            >
              {Ic(MdArrowDropDown, { size: 16, style: { color: "#0078d4" } })}
            </span>
          </button>

          {viewDropdownOpen && (
            <div className="sb-view-dropdown-menu">
              {viewOptions.map((view) => (
                <div
                  key={view}
                  className={`sb-view-dropdown-item${activeView === view ? " selected" : ""}`}
                  onClick={() => {
                    setActiveView(view);
                    setViewDropdownOpen(false);
                  }}
                >
                  <span style={{ marginLeft: 0 }}>{view}</span>
                  {activeView === view && (
                    <span style={{ marginLeft: "auto", color: "#0078d4" }}>
                      {Ic(FaCheck, { size: 12 })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ── List View Toggle Button ────────────────────────────────── */}
        <button
          className={`sb-view-btn${isListView ? " active" : ""}`}
          onClick={() => setIsListView(!isListView)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 10px",
            height: 32,
          }}
        >
          {Ic(MdList, { size: 20, style: { color: "#0078d4" } })}
          <span style={{ marginLeft: 4 }}>List</span>
        </button>

        <div className="sb-toolbar-divider" />

        {/* ── Date navigator ──────────────────────────────────────────── */}
        <div className="sb-date-nav">
          <button
            className="sb-date-nav-btn"
            aria-label="Previous"
            onClick={handlePrevDate}
          >
            {Ic(MdChevronLeft, { size: 20, style: { color: "#0078d4" } })}
          </button>
          <div className="sb-date-range">
            {Ic(FaCalendarAlt, { size: 13, style: { color: "#0078d4" } })}
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>
          <button
            className="sb-date-nav-btn"
            aria-label="Next"
            onClick={handleNextDate}
          >
            {Ic(MdChevronRight, { size: 20, style: { color: "#0078d4" } })}
          </button>
        </div>

        <div className="sb-toolbar-divider" />
        <button className="sb-btn primary">
          {Ic(FaCalendarPlus, { size: 13 })}
          <span>Book</span>
        </button>
        <div className="sb-toolbar-right">
          <button className="sb-icon-btn" title="Toggle columns">
            {Ic(MdViewColumn, { size: 18, style: { color: "#0078d4" } })}
          </button>
          <button className="sb-icon-btn" title="Settings">
            {Ic(MdSettings, { size: 18, style: { color: "#0078d4" } })}
          </button>
          <button className="sb-icon-btn" title="Refresh">
            {Ic(MdRefresh, { size: 18, style: { color: "#0078d4" } })}
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="sb-body">
        {/* ── Left Resource Panel ─────────────────────────────────────── */}
        <div className="sb-left-panel">
          <div className="sb-resource-search">
            <div className="sb-resource-search-inner">
              {Ic(MdSearch, {
                size: 19,
                style: { color: "#0078d4", flexShrink: 0 },
              })}
              <input
                type="text"
                placeholder="Search"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>
            <button className="sb-resource-sort-btn" title="Sort">
              {Ic(MdSort, { size: 16 })}
            </button>
          </div>

          <div className="sb-resource-list">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className={`sb-resource-row${selectedResourceId === resource.id ? " selected" : ""}`}
                onClick={() => setSelectedResourceId(resource.id)}
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
                        background:
                          resource.utilization > 75
                            ? "#d13438"
                            : resource.utilization > 50
                              ? "#0078d4"
                              : "#107c10",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          <div className="sb-resource-footer">
            <button className="sb-page-btn" disabled>
              {Ic(MdChevronLeft, { size: 20 })}
            </button>
            <span>
              1 – {filteredResources.length} of {RESOURCES.length}
            </span>
            <button className="sb-page-btn">
              {Ic(MdChevronRight, { size: 20 })}
            </button>
          </div>
        </div>

        {/* ── Gantt Center ─────────────────────────────────────────────── */}
        <div className="sb-gantt-wrapper">
          {isListView ? (
            /* ── List View Mode ──────────────────────────────────────── */
            <div className="sb-list-view-container">
              <table className="sb-list-view-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Work Order</th>
                    <th>Type</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource) => {
                    const resourceBookings = BOOKINGS.filter(
                      (b) => b.resourceId === resource.id,
                    );
                    return resourceBookings.map((booking) => (
                      <tr key={`${resource.id}-${booking.id}`}>
                        <td>
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <ResourceAvatar resource={resource} size={24} />
                            <span style={{ marginLeft: 8 }}>
                              {resource.name}
                            </span>
                          </div>
                        </td>
                        <td>{booking.workOrderId || "—"}</td>
                        <td>{booking.type}</td>
                        <td>{booking.startHour}:00</td>
                        <td>{booking.endHour}:00</td>
                        <td>{booking.durationLabel}</td>
                        <td>
                          <span className={`sb-status-${booking.color}`}>
                            {booking.isDashed ? "Draft" : "Scheduled"}
                          </span>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── Gantt View Mode ──────────────────────────────────────── */
            <>
              <div className="sb-date-label-row">Monday — 9/14/2020</div>

              {/* Sticky time header */}
              <div className="sb-time-header">
                <div
                  className="sb-time-header-inner"
                  ref={timeHeaderRef}
                  style={{
                    overflowX: "hidden",
                    pointerEvents: "none",
                    flex: 1,
                  }}
                >
                  <div style={{ display: "flex", width: totalWidth }}>
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

              {/* Scrollable rows */}
              <div
                className="sb-gantt-scroll"
                ref={ganttScrollRef}
                onScroll={handleGanttScroll}
              >
                <div className="sb-gantt-rows" style={{ width: totalWidth }}>
                  {filteredResources.map((resource) => (
                    <GanttRow
                      key={resource.id}
                      resource={resource}
                      bookings={BOOKINGS.filter(
                        (b) => b.resourceId === resource.id,
                      )}
                      timeSlots={TIME_SLOTS}
                      hourWidth={hourWidth}
                      startHour={START_HOUR}
                      isSelected={selectedResourceId === resource.id}
                    />
                  ))}
                </div>
              </div>

              {/* Zoom */}
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
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Panel ─────────────────────────────────────────────────── */}
      <div className="sb-bottom-panel">
        <div className="sb-bottom-tabs">
          <div
            className={`sb-bottom-tab${activeBottomTab === "open" ? " active" : ""}`}
            onClick={() => setActiveBottomTab("open")}
          >
            Open Requirements
          </div>
          <div
            className={`sb-bottom-tab${activeBottomTab === "unscheduled" ? " active" : ""}`}
            onClick={() => setActiveBottomTab("unscheduled")}
          >
            Unscheduled Work Orders
          </div>
          <div className="sb-bottom-tab">Project</div>
        </div>

        <RequirementsTable
          requirements={OPEN_REQUIREMENTS}
          selectedIds={selectedReqIds}
          onToggle={toggleReq}
        />

        <div className="sb-bottom-footer">
          <button className="sb-page-btn">
            {Ic(MdChevronLeft, { size: 20 })}
          </button>
          <span>
            1 – {OPEN_REQUIREMENTS.length} of {OPEN_REQUIREMENTS.length}
          </span>
          <button className="sb-page-btn" disabled>
            {Ic(MdChevronRight, { size: 20 })}
          </button>
        </div>
      </div>
    </div>
  );
};
