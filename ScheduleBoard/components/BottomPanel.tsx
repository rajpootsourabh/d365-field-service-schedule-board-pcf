// components/BottomPanel.tsx
import * as React from "react";
import { useState } from "react";
import type { IconType } from "react-icons";
import { MdSearch, MdRefresh, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { OpenRequirement } from "../mockData";
import "../css/BottomPanel.css";

interface IconProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

function Ic(Icon: IconType, props: IconProps = {}): JSX.Element {
  return React.createElement(Icon as React.ComponentType<IconProps>, props);
}

// Requirements Table Component
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
            onClick={() => onToggle(req.id)}
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
            <td>\n            </td>
            <td>\n            </td>
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

interface BottomPanelProps {
  requirements: OpenRequirement[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onRefresh?: () => void;
  onSearch?: (searchTerm: string) => void;
  isCollapsed?: boolean;  // Add this prop
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  requirements,
  selectedIds,
  onToggle,
  onRefresh,
  onSearch,
  isCollapsed = false,  // Default to false
}) => {
  const [bottomTab, setBottomTab] = useState<"open" | "unscheduled">("open");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className={`sb-bottom-panel ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sb-bottom-tabs">
        <div
          className={`sb-bottom-tab${bottomTab === "open" ? " active" : ""}`}
          onClick={() => setBottomTab("open")}
        >
          Open Requirements
        </div>
        <div
          className={`sb-bottom-tab${bottomTab === "unscheduled" ? " active" : ""}`}
          onClick={() => setBottomTab("unscheduled")}
        >
          Unscheduled Work Orders
        </div>
        <div className="sb-bottom-tab">Project</div>

        {/* Search box */}
        <div className="sb-bottom-tab-search">
          {Ic(MdSearch, { size: 14, style: { color: "#605e5c" } })}
          <input
            type="text"
            placeholder="Search by Requirement Name"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Refresh button */}
        <button
          className="sb-bottom-refresh-btn"
          onClick={handleRefresh}
          title="Refresh"
        >
          {Ic(MdRefresh, { size: 14, style: { color: "#0078d4" } })}
        </button>
      </div>

      <RequirementsTable
        requirements={requirements}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />

      <div className="sb-bottom-footer">
        <button className="sb-page-btn">
          {Ic(MdChevronLeft, { size: 18 })}
        </button>
        <span>
          1 – {requirements.length} of {requirements.length}
        </span>
        <button className="sb-page-btn" disabled>
          {Ic(MdChevronRight, { size: 18 })}
        </button>
      </div>
    </div>
  );
};