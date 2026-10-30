import { getDb } from "../data/repository";
import { AuditLog } from "../data/types";

export interface CreateAuditLogParams {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | object;
  ipAddress?: string;
}

export async function logAuditEvent(params: CreateAuditLogParams): Promise<void> {
  try {
    const db = await getDb();
    const detailsStr =
      typeof params.details === "object"
        ? JSON.stringify(params.details)
        : params.details || "";

    const log: AuditLog = {
      logId: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: params.userId || "anonymous",
      userName: params.userName || "Unknown",
      userRole: params.userRole || "User",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: detailsStr,
      ipAddress: params.ipAddress || "127.0.0.1",
    };

    await db.createAuditLog(log);
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
