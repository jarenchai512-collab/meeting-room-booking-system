import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/middleware-auth";
import { eventHub } from "@/lib/events/event-emitter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let registered = false;

  const stream = new ReadableStream({
    start(controller) {
      registered = true;
      eventHub.addClient(clientId, controller, session?.userId, session?.role);
    },
    cancel() {
      if (registered) {
        eventHub.removeClient(clientId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
