import mongoose, { Schema, type Document } from "mongoose";

export interface IAuditLog extends Document {
  organizationId: mongoose.Types.ObjectId | null;
  actorId: mongoose.Types.ObjectId | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog =
  (mongoose.models.AuditLog as mongoose.Model<IAuditLog>) ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
