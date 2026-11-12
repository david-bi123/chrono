import mongoose, { Schema, type Document } from "mongoose";
import { PLAN_IDS } from "@/lib/subscriptions/plans";

export type SubscriptionEventType =
  | "PLAN_ASSIGNED"
  | "PLAN_CHANGED"
  | "STATUS_CHANGED"
  | "PERIOD_EXTENDED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED";

/**
 * Append-only plan history for the super-admin console. Audit logs record the
 * raw action; this collection is what the "plan history" UI reads.
 */
export interface ISubscriptionEvent extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: SubscriptionEventType;
  fromPlan?: string | null;
  toPlan?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: mongoose.Types.ObjectId | null;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionEventSchema = new Schema<ISubscriptionEvent>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    type: { type: String, enum: ["PLAN_ASSIGNED", "PLAN_CHANGED", "STATUS_CHANGED", "PERIOD_EXTENDED", "PAYMENT_SUCCEEDED", "PAYMENT_FAILED"], required: true, index: true },
    fromPlan: { type: String, enum: [...PLAN_IDS, null], default: null },
    toPlan: { type: String, enum: [...PLAN_IDS, null], default: null },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, default: null },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SubscriptionEventSchema.index({ organizationId: 1, createdAt: -1 });

export const SubscriptionEvent =
  (mongoose.models.SubscriptionEvent as mongoose.Model<ISubscriptionEvent>) ??
  mongoose.model<ISubscriptionEvent>("SubscriptionEvent", SubscriptionEventSchema);
