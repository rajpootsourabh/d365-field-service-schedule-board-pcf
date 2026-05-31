// CreateBookingPanel.tsx
import * as React from "react";
import { useState } from "react";
import type { IconType } from "react-icons";
import { MdClose, MdCalendarToday, MdExpandMore } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

import {
  Resource,
  REQUIREMENTS,
  BOOKING_STATUSES,
  BOOKING_METHODS,
} from "../mockData";
import "../css/CreateBookingPanel.css";

// Import the avatarColor function from your main file or duplicate it here
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

// Icon helper
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}
function Ic(Icon: IconType, props: IconProps = {}): JSX.Element {
  return React.createElement(Icon as React.ComponentType<IconProps>, props);
}

export interface BookingFormState {
  requirementId: string;
  requirementName: string;
  resourceId: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  bookingStatus: string;
  bookingMethod: string;
}

interface CreateBookingPanelProps {
  resources: Resource[];
  onClose: () => void;
  onBook: (booking: BookingFormState) => void;
  preselectedResourceId?: string;
  preselectedRequirementId?: string;
}

export const CreateBookingPanel: React.FC<CreateBookingPanelProps> = ({
  resources,
  onClose,
  onBook,
  preselectedResourceId,
  preselectedRequirementId,
}) => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const formatDateForDisplay = (date: Date): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")} ${date.getFullYear()}`;
  };

  const [form, setForm] = useState<BookingFormState>({
    requirementId: preselectedRequirementId || "",
    requirementName: "",
    resourceId: preselectedResourceId || "",
    resourceName: "",
    startDate: formatDateForDisplay(today),
    endDate: formatDateForDisplay(nextWeek),
    bookingStatus: "Scheduled",
    bookingMethod: "Front Load Hours",
  });

  const [reqSearch, setReqSearch] = useState("");
  const [reqDropOpen, setReqDropOpen] = useState(false);
  const [resDropOpen, setResDropOpen] = useState(false);
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [methodDropOpen, setMethodDropOpen] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingFormState, string>>
  >({});

  const filteredRequirements = REQUIREMENTS.filter((req) =>
    req.name.toLowerCase().includes(reqSearch.toLowerCase()),
  );

  const selectedRequirement = REQUIREMENTS.find(
    (r) => r.id === form.requirementId,
  );
  const selectedResource = resources.find((r) => r.id === form.resourceId);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof BookingFormState, string>> = {};
    if (!form.requirementId) errs.requirementId = "Requirement is required";
    if (!form.resourceId) errs.resourceId = "Resource is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBook = () => {
    if (!validate()) return;
    const bookingData = {
      ...form,
      requirementName: selectedRequirement?.name || "",
      resourceName: selectedResource?.name || "",
    };
    onBook(bookingData);
    setBookingDone(true);
  };

  const handleCreateAnother = () => {
    setBookingDone(false);
    setForm({
      requirementId: "",
      requirementName: "",
      resourceId: "",
      resourceName: "",
      startDate: formatDateForDisplay(today),
      endDate: formatDateForDisplay(nextWeek),
      bookingStatus: "Scheduled",
      bookingMethod: "Front Load Hours",
    });
    setReqSearch("");
  };

  if (bookingDone) {
    return (
      <div className="cbp-container">
        <div className="cbp-header">
          <span className="cbp-title">Create Booking</span>
          <button className="cbp-close-btn" onClick={onClose}>
            {Ic(MdClose, { size: 20 })}
          </button>
        </div>
        <div className="cbp-success">
          <div className="cbp-success-icon">
            {Ic(FaCheck, { size: 32, style: { color: "#107c10" } })}
          </div>
          <div className="cbp-success-title">Booking Confirmed!</div>
          <div className="cbp-success-detail">
            <strong>{selectedRequirement?.name}</strong> has been booked for
            <br />
            <strong>{selectedResource?.name}</strong>
          </div>
          <div className="cbp-success-dates">
            📅 {form.startDate} → {form.endDate}
          </div>
          <div className="cbp-success-status">
            Status: {form.bookingStatus} · Method: {form.bookingMethod}
          </div>
          <button className="cbp-new-btn" onClick={handleCreateAnother}>
            + Create Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cbp-container">
      <div className="cbp-header">
        <span className="cbp-title">Create Booking</span>
        <button className="cbp-close-btn" onClick={onClose}>
          {Ic(MdClose, { size: 20 })}
        </button>
      </div>

      <div className="cbp-body">
        {/* Requirement Field */}
        <div className="cbp-field">
          <label className="cbp-label">Requirement</label>
          <div
            className={`cbp-pill-input ${errors.requirementId ? "error" : ""}`}
            onClick={() => setReqDropOpen(!reqDropOpen)}
          >
            {selectedRequirement ? (
              <span className="cbp-pill">
                {selectedRequirement.name}
                <button
                  className="cbp-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((f) => ({
                      ...f,
                      requirementId: "",
                      requirementName: "",
                    }));
                  }}
                >
                  {Ic(MdClose, { size: 12 })}
                </button>
              </span>
            ) : (
              <input
                className="cbp-pill-search"
                placeholder="Search requirement..."
                value={reqSearch}
                onChange={(e) => {
                  setReqSearch(e.target.value);
                  setReqDropOpen(true);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
          {errors.requirementId && (
            <span className="cbp-error">{errors.requirementId}</span>
          )}

          {reqDropOpen && !selectedRequirement && (
            <div className="cbp-dropdown">
              {filteredRequirements.length === 0 ? (
                <div className="cbp-dropdown-empty">No requirements found</div>
              ) : (
                filteredRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="cbp-dropdown-item"
                    onClick={() => {
                      setForm((f) => ({ ...f, requirementId: req.id }));
                      setReqDropOpen(false);
                      setReqSearch("");
                    }}
                  >
                    <div>
                      <div className="cbp-dropdown-name">{req.name}</div>
                      <div className="cbp-dropdown-sub">
                        {req.duration}{" "}
                        {req.territory ? `· ${req.territory}` : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Resource Field */}
        <div className="cbp-field">
          <label className="cbp-label">Resource</label>
          <div
            className={`cbp-pill-input ${errors.resourceId ? "error" : ""}`}
            onClick={() => setResDropOpen(!resDropOpen)}
          >
            {selectedResource ? (
              <span className="cbp-pill cbp-pill-resource">
                <div
                  className="cbp-pill-avatar"
                  style={{ background: avatarColor(selectedResource.name) }}
                >
                  {selectedResource.initials}
                </div>
                {selectedResource.name}
                <button
                  className="cbp-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((f) => ({
                      ...f,
                      resourceId: "",
                      resourceName: "",
                    }));
                  }}
                >
                  {Ic(MdClose, { size: 12 })}
                </button>
              </span>
            ) : (
              <span className="cbp-placeholder">Select resource...</span>
            )}
            {Ic(MdExpandMore, {
              size: 18,
              style: { marginLeft: "auto", color: "#605e5c" },
            })}
          </div>
          {errors.resourceId && (
            <span className="cbp-error">{errors.resourceId}</span>
          )}

          {resDropOpen && (
            <div className="cbp-dropdown">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className={`cbp-dropdown-item ${form.resourceId === res.id ? "selected" : ""}`}
                  onClick={() => {
                    setForm((f) => ({ ...f, resourceId: res.id }));
                    setResDropOpen(false);
                  }}
                >
                  <div
                    className="cbp-dropdown-avatar"
                    style={{ background: avatarColor(res.name) }}
                  >
                    {res.initials}
                  </div>
                  <div>
                    <div className="cbp-dropdown-name">{res.name}</div>
                    <div className="cbp-dropdown-sub">
                      {res.utilization}% utilization · {res.bookedHours}
                    </div>
                  </div>
                  {form.resourceId === res.id && (
                    <span className="cbp-dropdown-check">
                      {Ic(FaCheck, { size: 12 })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Date */}
        <div className="cbp-field">
          <label className="cbp-label">Start Date</label>
          <div className={`cbp-date-input ${errors.startDate ? "error" : ""}`}>
            <input
              type="text"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
              placeholder="e.g., Sun Feb 07 2021"
            />
            <span className="cbp-date-icon">
              {Ic(MdCalendarToday, { size: 16 })}
            </span>
          </div>
          {errors.startDate && (
            <span className="cbp-error">{errors.startDate}</span>
          )}
        </div>

        {/* End Date */}
        <div className="cbp-field">
          <label className="cbp-label">End Date</label>
          <div className={`cbp-date-input ${errors.endDate ? "error" : ""}`}>
            <input
              type="text"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
              placeholder="e.g., Sat Mar 06 2021"
            />
            <span className="cbp-date-icon">
              {Ic(MdCalendarToday, { size: 16 })}
            </span>
          </div>
          {errors.endDate && (
            <span className="cbp-error">{errors.endDate}</span>
          )}
        </div>

        {/* Booking Status */}
        <div className="cbp-field">
          <label className="cbp-label">Booking Status</label>
          <div
            className="cbp-select"
            onClick={() => setStatusDropOpen(!statusDropOpen)}
          >
            <span>{form.bookingStatus}</span>
            {Ic(MdExpandMore, { size: 18, style: { color: "#605e5c" } })}
          </div>
          {statusDropOpen && (
            <div className="cbp-dropdown">
              {BOOKING_STATUSES.map((status) => (
                <div
                  key={status}
                  className={`cbp-dropdown-item ${form.bookingStatus === status ? "selected" : ""}`}
                  onClick={() => {
                    setForm((f) => ({ ...f, bookingStatus: status }));
                    setStatusDropOpen(false);
                  }}
                >
                  <span>{status}</span>
                  {form.bookingStatus === status && (
                    <span className="cbp-dropdown-check">
                      {Ic(FaCheck, { size: 12 })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Method */}
        <div className="cbp-field">
          <label className="cbp-label">Booking Method</label>
          <div
            className="cbp-select"
            onClick={() => setMethodDropOpen(!methodDropOpen)}
          >
            <span>{form.bookingMethod}</span>
            {Ic(MdExpandMore, { size: 18, style: { color: "#605e5c" } })}
          </div>
          {methodDropOpen && (
            <div className="cbp-dropdown">
              {BOOKING_METHODS.map((method) => (
                <div
                  key={method}
                  className={`cbp-dropdown-item ${form.bookingMethod === method ? "selected" : ""}`}
                  onClick={() => {
                    setForm((f) => ({ ...f, bookingMethod: method }));
                    setMethodDropOpen(false);
                  }}
                >
                  <span>{method}</span>
                  {form.bookingMethod === method && (
                    <span className="cbp-dropdown-check">
                      {Ic(FaCheck, { size: 12 })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cbp-footer">
        <button className="cbp-book-btn" onClick={handleBook}>
          Book
        </button>
      </div>
    </div>
  );
};
