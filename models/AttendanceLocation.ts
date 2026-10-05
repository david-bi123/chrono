import mongoose, { Schema, type Document } from "mongoose";

export interface IAttendanceLocation extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  tokenHash: string;
  status: "ACTIVE" | "REVOKED";
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceLocationSchema = new Schema<IAttendanceLocation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tokenHash: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["ACTIVE", "REVOKED"], default: "ACTIVE", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

AttendanceLocationSchema.index({ organizationId: 1, status: 1 });

export const AttendanceLocation =
  (mongoose.models.AttendanceLocation as mongoose.Model<IAttendanceLocation>) ??
  mongoose.model<IAttendanceLocation>("AttendanceLocation", AttendanceLocationSchema);
