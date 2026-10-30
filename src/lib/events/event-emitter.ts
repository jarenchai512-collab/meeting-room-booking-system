/**
 * Server-Sent Events (SSE) Event Hub
 * Dispatches real-time events to active browser clients with zero external infrastructure cost.
 */

export interface SystemEvent {
  id: string;
  type:
    | "booking_created"
    | "booking_approved"
    | "booking_rejected"
    | "booking_cancelled"
    | "room_updated"
    | "notification";
  payload: any;
  timestamp: string;
}

type EventClient = {
  id: string;
  userId?: string;
  role?: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

class SystemEventHub {
  private clients: Map<string, EventClient> = new Map();
  private encoder = new TextEncoder();

  /**
   * Register a new SSE connection
   */
  addClient(
    id: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
    userId?: string,
    role?: string
  ) {
    this.clients.set(id, { id, userId, role, controller });

    // Send initial handshake
    this.sendToClient(controller, "connected", {
      clientId: id,
      message: "Real-time connection established",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove a client upon disconnect
   */
  removeClient(id: string) {
    this.clients.delete(id);
  }

  /**
   * Get active connection count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Broadcast an event to all connected clients (or filter by role/userId)
   */
  broadcast(
    type: SystemEvent["type"],
    payload: any,
    target?: { role?: string; userId?: string }
  ) {
    const event: SystemEvent = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    for (const [clientId, client] of this.clients.entries()) {
      try {
        if (target?.userId && client.userId && client.userId !== target.userId) {
          continue;
        }
        if (target?.role && client.role && client.role !== target.role) {
          continue;
        }
        this.sendToClient(client.controller, type, event);
      } catch (err) {
        // Stale connection, remove
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Send heartbeat to keep HTTP connections active
   */
  sendHeartbeat() {
    for (const [clientId, client] of this.clients.entries()) {
      try {
        const pingData = this.encoder.encode(`: ping\n\n`);
        client.controller.enqueue(pingData);
      } catch {
        this.clients.delete(clientId);
      }
    }
  }

  private sendToClient(
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: string,
    data: any
  ) {
    const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(this.encoder.encode(chunk));
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __systemEventHub: SystemEventHub | undefined;
  // eslint-disable-next-line no-var
  var __heartbeatInterval: NodeJS.Timeout | undefined;
}

export const eventHub =
  globalThis.__systemEventHub || (globalThis.__systemEventHub = new SystemEventHub());

// Run a 25-second heartbeat
if (!globalThis.__heartbeatInterval) {
  globalThis.__heartbeatInterval = setInterval(() => {
    eventHub.sendHeartbeat();
  }, 25000);
}
