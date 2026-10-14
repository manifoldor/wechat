/**
 * In-memory TTL Cache with automatic expiration cleanup.
 */
export class TtlCache {
    defaultTtlSeconds;
    cache = new Map();
    cleanupTimer = null;
    constructor(defaultTtlSeconds = 3600) {
        this.defaultTtlSeconds = defaultTtlSeconds;
        this.startCleanupInterval();
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value, ttlSeconds = this.defaultTtlSeconds) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiresAt });
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.cache.clear();
    }
    startCleanupInterval() {
        if (this.cleanupTimer)
            return;
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiresAt) {
                    this.cache.delete(key);
                }
            }
        }, 60 * 1000);
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }
}
//# sourceMappingURL=cache.js.map