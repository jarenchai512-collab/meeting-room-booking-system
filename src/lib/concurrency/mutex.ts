/**
 * Concurrency Mutex and Idempotency Key Manager
 * Prevents race conditions and double bookings under concurrent multi-user load.
 */

interface MutexQueueItem {
  resolve: () => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

class RoomMutexManager {
  private locks: Map<string, boolean> = new Map();
  private queues: Map<string, MutexQueueItem[]> = new Map();
  private idempotencyStore: Map<
    string,
    { timestamp: number; response: any; status: number }
  > = new Map();

  /**
   * Acquire an exclusive lock for a room.
   * If the room is currently locked by another concurrent request, this waits in a FIFO queue.
   * Timeout defaults to 8,000ms to prevent deadlocks.
   */
  async acquire(roomId: string, timeoutMs: number = 8000): Promise<() => void> {
    const isLocked = this.locks.get(roomId) || false;

    if (!isLocked) {
      this.locks.set(roomId, true);
      return () => this.release(roomId);
    }

    return new Promise<() => void>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Remove from queue on timeout
        const queue = this.queues.get(roomId) || [];
        const index = queue.findIndex((item) => item.timer === timer);
        if (index !== -1) queue.splice(index, 1);
        reject(
          new Error(
            `Timeout waiting for room lock (${roomId}) after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);

      const queue = this.queues.get(roomId) || [];
      queue.push({
        resolve: () => {
          clearTimeout(timer);
          resolve(() => this.release(roomId));
        },
        reject,
        timer,
      });
      this.queues.set(roomId, queue);
    });
  }

  /**
   * Release the lock for a room and wake up the next waiter in line.
   */
  private release(roomId: string) {
    const queue = this.queues.get(roomId);

    if (queue && queue.length > 0) {
      const next = queue.shift();
      if (next) {
        next.resolve();
        return;
      }
    }

    this.locks.delete(roomId);
    this.queues.delete(roomId);
  }

  /**
   * Check if an idempotency key was already processed
   */
  getIdempotencyResult(key: string): { response: any; status: number } | null {
    if (!key) return null;
    const existing = this.idempotencyStore.get(key);
    if (!existing) return null;

    // 10-minute TTL
    if (Date.now() - existing.timestamp > 10 * 60 * 1000) {
      this.idempotencyStore.delete(key);
      return null;
    }
    return { response: existing.response, status: existing.status };
  }

  /**
   * Save result of an idempotency key
   */
  saveIdempotencyResult(key: string, response: any, status: number = 200) {
    if (!key) return;
    this.idempotencyStore.set(key, {
      timestamp: Date.now(),
      response,
      status,
    });

    // Cleanup older keys if store grows large
    if (this.idempotencyStore.size > 2000) {
      const now = Date.now();
      this.idempotencyStore.forEach((v, k) => {
        if (now - v.timestamp > 10 * 60 * 1000) {
          this.idempotencyStore.delete(k);
        }
      });
    }
  }
}

// Global Singleton to survive hot-reload in development
declare global {
  // eslint-disable-next-line no-var
  var __roomMutexManager: RoomMutexManager | undefined;
}

export const roomMutex =
  globalThis.__roomMutexManager || (globalThis.__roomMutexManager = new RoomMutexManager());
