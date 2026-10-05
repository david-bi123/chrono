import mongoose, { Schema, type Document } from "mongoose";

export type Role = "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "STAFF";
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED";

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId | null;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  avatarUrl?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    role: { type: String, enum: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"], required: true, index: true },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, select: false },
    phone: { type: String, trim: true, maxlength: 40 },
    avatarUrl: { type: String, maxlength: 500 },
    employeeId: { type: String, trim: true, maxlength: 40 },
    department: { type: String, trim: true, maxlength: 80 },
    position: { type: String, trim: true, maxlength: 80 },
    status: { type: String, enum: ["PENDING", "ACTIVE", "DISABLED"], default: "PENDING", index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Email must be globally unique (login is by email).
UserSchema.index({ email: 1 }, { unique: true });
// employeeId unique per org (sparse so super-admins without org are fine).
UserSchema.index({ organizationId: 1, employeeId: 1 }, { unique: true, sparse: true });

export const User = (mongoose.models.User as mongoose.Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema);
