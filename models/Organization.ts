import mongoose, { Schema, type Document } from "mongoose";

export interface IAttendanceSettings {
  timezone: string;
  workStart: string; // "08:00"
  workEnd: string; // "17:00"
  graceMinutes: number;
  workingDays: number[]; // 0=Sun..6=Sat
  requireClockOut: boolean;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  logoUrl?: string;
  timezone: string;
  status: "ACTIVE" | "SUSPENDED";
  attendanceSettings: IAttendanceSettings;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSettingsSchema = new Schema<IAttendanceSettings>(
  {
    timezone: { type: String, default: "Africa/Accra" },
    workStart: { type: String, default: "08:00" },
    workEnd: { type: String, default: "17:00" },
    graceMinutes: { type: Number, default: 15, min: 0, max: 120 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    requireClockOut: { type: Boolean, default: true },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 40 },
    address: { type: String, trim: true, maxlength: 300 },
    industry: { type: String, trim: true, maxlength: 100 },
    logoUrl: { type: String, maxlength: 500 },
    timezone: { type: String, default: "Africa/Accra" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE", index: true },
    attendanceSettings: { type: AttendanceSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

OrganizationSchema.index({ name: 1 });

export const Organization =
  (mongoose.models.Organization as mongoose.Model<IOrganization>) ??
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
