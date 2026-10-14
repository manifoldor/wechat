/**
 * In-memory TTL Cache with automatic expiration cleanup.
 */
export declare class TtlCache<T = unknown> {
    private defaultTtlSeconds;
    private cache;
    private cleanupTimer;
    constructor(defaultTtlSeconds?: number);
    get(key: string): T | undefined;
    set(key: string, value: T, ttlSeconds?: number): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    destroy(): void;
    private startCleanupInterval;
}
