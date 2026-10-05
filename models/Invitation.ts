import mongoose, { Schema, type Document } from "mongoose";

export type InvitationType = "ORG_ADMIN" | "STAFF" | "PASSWORD_RESET";

export interface IInvitation extends Document {
  organizationId: mongoose.Types.ObjectId | null;
  email: string;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  type: InvitationType;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["ORG_ADMIN", "STAFF", "PASSWORD_RESET"], required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invitation =
  (mongoose.models.Invitation as mongoose.Model<IInvitation>) ??
  mongoose.model<IInvitation>("Invitation", InvitationSchema);
