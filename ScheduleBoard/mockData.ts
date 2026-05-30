// mockData.ts — Hardcoded data for the Schedule Board PCF control

export interface Resource {
  id: string;
  name: string;
  initials: string;
  avatarImage?: string;
  utilization: number; // percentage
  bookedHours: string;
}

export interface Booking {
  id: string;
  resourceId: string;
  title: string;
  type: "Work Order" | "Requirement";
  durationLabel: string;
  startHour: number;   // e.g. 8.0 = 8:00 AM, 8.5 = 8:30 AM
  endHour: number;     // e.g. 10.25 = 10:15 AM
  color: "blue" | "light-blue" | "pink" | "dark-blue" | "green" | "grey";
  icon: "clock" | "car" | "check" | "cancel" | "coffee" | "wrench";
  isDashed?: boolean;  // for unscheduled placeholder
  workOrderId?: string;
}

export interface OpenRequirement {
  id: string;
  name: string;
  fromDate: string;
  toDate: string;
  duration: string;
  fulfilled: string;
  remaining: string;
  priority: string;
  territory: string;
  status: string;
}


// ─── Resources ────────────────────────────────────────────────────────────────
export const RESOURCES: Resource[] = [
  { id: "r1", name: "David Smith", initials: "DS", utilization: 72, bookedHours: "5h 42m booked" },
  { id: "r2", name: "Jim Glynn", initials: "JG", utilization: 45, bookedHours: "3h 36m booked" },
  { id: "r3", name: "Maria Campbell", initials: "MC", utilization: 88, bookedHours: "7h 04m booked" },
  { id: "r4", name: "Nancy Anderson", initials: "NA", utilization: 30, bookedHours: "2h 24m booked" },
  { id: "r5", name: "Patrick Sands", initials: "PS", utilization: 60, bookedHours: "4h 48m booked" },
  { id: "r6", name: "Paul Cannon", initials: "PC", utilization: 0, bookedHours: "0m booked" },
  { id: "r7", name: "Rene Valdes", initials: "RV", utilization: 52, bookedHours: "4h 10m booked" },
  { id: "r8", name: "Robert Lyon", initials: "RL", utilization: 15, bookedHours: "1h 12m booked" },
  { id: "r9", name: "Saurabh Raj", initials: "SR", utilization: 15, bookedHours: "1h 12m booked" },
];

// ─── Bookings ─────────────────────────────────────────────────────────────────
// startHour/endHour are fractional hours from 7:00 AM baseline
// e.g. 8.0 = 8:00 AM (hour offset 1 from 7 AM), stored as absolute hours
export const BOOKINGS: Booking[] = [
  // David Smith
  { id: "b1",  resourceId: "r1", title: "Install Vacuum",      type: "Requirement", durationLabel: "3h 05m", startHour: 8.0,  endHour: 11.083, color: "blue",       icon: "clock",  workOrderId: "00101" },
  { id: "b2",  resourceId: "r1", title: "Fix Washer",          type: "Requirement", durationLabel: "1h 03m", startHour: 11.5, endHour: 12.55,  color: "light-blue", icon: "wrench", workOrderId: "00102" },

  // Jim Glynn
  { id: "b3",  resourceId: "r2", title: "Buy and Deliver Parts", type: "Requirement", durationLabel: "1h 44m", startHour: 8.0,  endHour: 9.733, color: "blue",       icon: "car",    workOrderId: "00048" },

  // Maria Campbell (selected resource)
  { id: "b4",  resourceId: "r3", title: "Deliver Packages",    type: "Requirement", durationLabel: "1h 47m", startHour: 8.0,  endHour: 9.783,  color: "blue",       icon: "clock",  workOrderId: "00106" },
  { id: "b5",  resourceId: "r3", title: "Install Washer",      type: "Requirement", durationLabel: "2h 00m", startHour: 10.0, endHour: 12.0,   color: "light-blue", icon: "clock",  workOrderId: "00117" },
  { id: "b6",  resourceId: "r3", title: "Fix Engine",          type: "Requirement", durationLabel: "1h 08m", startHour: 12.0, endHour: 13.133, color: "blue",       icon: "wrench", workOrderId: "00130" },
  { id: "b7",  resourceId: "r3", title: "Install (cont.)",     type: "Requirement", durationLabel: "2h 14m", startHour: 13.5, endHour: 15.733, color: "light-blue", icon: "clock",  workOrderId: "00126", isDashed: false },

  // Nancy Anderson
  { id: "b8",  resourceId: "r4", title: "Fix Boiler",          type: "Requirement", durationLabel: "1h 26m", startHour: 8.0,  endHour: 9.433,  color: "blue",       icon: "wrench", workOrderId: "00114" },
  { id: "b9",  resourceId: "r4", title: "Preventive Maint.",   type: "Requirement", durationLabel: "2h 14m", startHour: 11.0, endHour: 13.233, color: "light-blue", icon: "clock",  workOrderId: "00118" },

  // Patrick Sands
  { id: "b10", resourceId: "r5", title: "Install Mount",       type: "Requirement", durationLabel: "3h 22m", startHour: 8.0,  endHour: 11.367, color: "blue",       icon: "clock",  workOrderId: "00134" },

  // Paul Cannon — empty (dashed placeholder)
  { id: "b11", resourceId: "r6", title: "New Lawn",            type: "Requirement", durationLabel: "1h 59m", startHour: 9.0,  endHour: 10.983, color: "grey",       icon: "clock",  isDashed: true },

  // Rene Valdes
  { id: "b12", resourceId: "r7", title: "Install Projector",   type: "Requirement", durationLabel: "3h 22m", startHour: 8.0,  endHour: 11.367, color: "blue",       icon: "clock",  workOrderId: "00125" },

  // Robert Lyon
  { id: "b13", resourceId: "r8", title: "Install Bookshelf",   type: "Requirement", durationLabel: "3h 00m", startHour: 8.5,  endHour: 11.5,   color: "light-blue", icon: "wrench", workOrderId: "00158" },
];

// ─── Open Requirements ────────────────────────────────────────────────────────
export const OPEN_REQUIREMENTS: OpenRequirement[] = [
  { id: "req1", name: "New Lawn",        fromDate: "9/12/2020", toDate: "9/14/2020", duration: "1 hr 59 mins", fulfilled: "0 mins", remaining: "1 hr 59 mins", priority: "", territory: "",   status: "Active" },
  { id: "req2", name: "Install Bookshelf", fromDate: "",        toDate: "",          duration: "3 hrs",         fulfilled: "0 mins", remaining: "3 hrs",        priority: "", territory: "",   status: "Active" },
  { id: "req3", name: "Pick Up Trash",   fromDate: "",          toDate: "",          duration: "1 hr 30 mins",  fulfilled: "0 mins", remaining: "1 hr 30 mins", priority: "", territory: "",   status: "Active" },
  { id: "req4", name: "Mow Lawn",        fromDate: "",          toDate: "",          duration: "2 hrs",         fulfilled: "0 mins", remaining: "2 hrs",        priority: "", territory: "WA", status: "Active" },
  { id: "req5", name: "Repair Fence",    fromDate: "",          toDate: "",          duration: "1 hr",          fulfilled: "0 mins", remaining: "1 hr",         priority: "", territory: "WA", status: "Active" },
];

// ─── Time Slots ───────────────────────────────────────────────────────────────
export const TIME_SLOTS: string[] = [
  "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM",
];

export const START_HOUR = 7; // 7:00 AM
export const HOUR_WIDTH_PX = 120; // pixels per hour column