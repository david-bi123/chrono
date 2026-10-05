import { dbConnect } from "./db/mongoose";
import { AuditLog } from "@/models/AuditLog";

interface AuditInput {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      organizationId: input.organizationId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  } catch (err) {
    console.error("audit write failed", err);
  }
}

export function auditContextFrom(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  };
}
