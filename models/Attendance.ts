import mongoose, { Schema, type Document } from "mongoose";

export interface IAttendance extends Document {
  organizationId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId | null;
  date: string; // YYYY-MM-DD in org timezone
  clockIn?: Date | null;
  clockOut?: Date | null;
  timezone: string;
  status: "PRESENT" | "LATE" | "EARLY_LEAVE" | "HALF_DAY" | "INCOMPLETE" | "ON_LEAVE";
  totalMinutes?: number;
  source: "QR" | "MANUAL";
  correctionReason?: string;
  correctedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "AttendanceLocation", default: null },
    date: { type: String, required: true, index: true },
    clockIn: { type: Date, default: null },
    clockOut: { type: Date, default: null },
    timezone: { type: String, default: "Africa/Accra" },
    status: {
      type: String,
      enum: ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY", "INCOMPLETE", "ON_LEAVE"],
      default: "PRESENT",
      index: true,
    },
    totalMinutes: { type: Number, default: 0 },
    source: { type: String, enum: ["QR", "MANUAL"], default: "QR" },
    correctionReason: { type: String, maxlength: 500 },
    correctedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// One record per staff per day (prevents duplicate clock-ins at DB level).
AttendanceSchema.index({ organizationId: 1, staffId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ organizationId: 1, date: 1, status: 1 });

export const Attendance =
  (mongoose.models.Attendance as mongoose.Model<IAttendance>) ??
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);
