export type UserRole = "employee" | "manager" | "admin";
export type EntryType = "entry" | "pause" | "return" | "exit" | "overtime";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type WorkState = "working" | "paused" | "overtime" | "off";

export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy: number;
  label?: string;
};

export type TimeEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EntryType;
  timestamp: string;
  businessDate?: string | null;
  pairingGroup?: string | null;
  location: GeoPoint;
  isOvertime: boolean;
  ipAddress: string;
  deviceLabel: string;
  selfiePath?: string | null;
  selfieUrl?: string | null;
};

export type EditRequest = {
  id: string;
  employeeName: string;
  requestedAt: string;
  date: string;
  kind?: "adjust" | "overtime" | "justification";
  reason: string;
  status: ApprovalStatus;
  requestedTime: string;
  reviewNotes?: string | null;
  requestedEventType?: EntryType;
};

export type ActiveWorker = {
  id: string;
  name: string;
  team: string;
  status: WorkState;
  lastEvent: string;
  location: GeoPoint;
};

export type ScheduleRule = {
  enabled: boolean;
  start: string;
  end: string;
};

export type WorkScheduleSettings = {
  timezone: string;
  toleranceMinutes: number;
  overtimeGraceMinutes: number;
  geofence: {
    enabled: boolean;
    radiusMeters: number;
    center: GeoPoint;
  };
  weekdays: Record<number, ScheduleRule>;
};
