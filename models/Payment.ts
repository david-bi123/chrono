import mongoose, { Schema, type Document } from "mongoose";
import { PLAN_IDS } from "@/lib/subscriptions/plans";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED" | "REVERSED";

/**
 * One row per Paystack transaction attempt.
 *
 * `reference` is unique so webhook retries are idempotent: the first SUCCESS
 * wins and later deliveries update nothing. Amounts are stored in pesewas
 * (Paystack's smallest unit) alongside the GHS figure for display.
 */
export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  provider: "PAYSTACK";
  reference: string;
  plan: (typeof PLAN_IDS)[number];
  amountGhs: number;
  amountPesewas: number;
  currency: "GHS";
  status: PaymentStatus;
  channel?: string;
  paidAt?: Date | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  initiatedBy?: mongoose.Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    provider: { type: String, enum: ["PAYSTACK"], default: "PAYSTACK" },
    reference: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: PLAN_IDS, required: true },
    amountGhs: { type: Number, required: true, min: 0 },
    amountPesewas: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["GHS"], default: "GHS" },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "ABANDONED", "REVERSED"], default: "PENDING", index: true },
    channel: { type: String, maxlength: 40 },
    paidAt: { type: Date, default: null },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PaymentSchema.index({ organizationId: 1, createdAt: -1 });

export const Payment =
  (mongoose.models.Payment as mongoose.Model<IPayment>) ?? mongoose.model<IPayment>("Payment", PaymentSchema);
