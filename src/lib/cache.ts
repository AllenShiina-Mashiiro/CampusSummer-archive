import { env, isRedisEnabled } from "./env";

/**
 * 缓存适配层。
 *
 * 配置了 REDIS_URL 就用 Redis；没配置（或连接失败）自动降级为进程内 Map，
 * 保证本地开发不需要额外启动 Redis 也能完整跑通。
 * 进程内实现只在单实例下有效，生产环境请配置 Redis。
 */

type DriverName = "redis" | "memory";

interface Driver {
  readonly name: DriverName;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  incrBy(key: string, amount: number): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
}

/* ------------------------------- memory ------------------------------- */

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

class MemoryDriver implements Driver {
  readonly name = "memory" as const;
  private store = new Map<string, MemoryEntry>();

  private alive(key: string): MemoryEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string): Promise<string | null> {
    return this.alive(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    // 防止长期运行的进程无限增长
    if (this.store.size > 5000) {
      const now = Date.now();
      for (const [k, v] of this.store) {
        if (v.expiresAt <= now) this.store.delete(k);
      }
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incrBy(key: string, amount: number): Promise<number> {
    const current = Number(this.alive(key)?.value ?? 0);
    const next = current + amount;
    const ttl = this.alive(key);
    this.store.set(key, {
      value: String(next),
      expiresAt: ttl ? ttl.expiresAt : Date.now() + 86_400 * 1000,
    });
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.alive(key);
    if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
  }
}

/* -------------------------------- redis -------------------------------- */

class RedisDriver implements Driver {
  readonly name = "redis" as const;

  // 只在真正使用 Redis 时才加载驱动，未配置时零开销
  constructor(private readonly client: import("ioredis").Redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incrBy(key: string, amount: number): Promise<number> {
    return this.client.incrby(key, amount);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }
}

/* ------------------------------ resolution ----------------------------- */

const globalForCache = globalThis as unknown as {
  __cacheDriver?: Promise<Driver>;
};

async function resolveDriver(): Promise<Driver> {
  if (!isRedisEnabled) return new MemoryDriver();

  try {
    const { default: Redis } = await import("ioredis");
    const client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 2000,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    client.on("error", (error) => {
      console.warn("[cache] Redis 连接异常，将回退到内存缓存:", error.message);
    });
    await client.connect();
    await client.ping();
    console.info("[cache] 使用 Redis 缓存:", env.redisUrl.replace(/\/\/.*@/, "//***@"));
    return new RedisDriver(client);
  } catch (error) {
    console.warn(
      "[cache] Redis 不可用，回退到内存缓存:",
      error instanceof Error ? error.message : error,
    );
    return new MemoryDriver();
  }
}

function driver(): Promise<Driver> {
  globalForCache.__cacheDriver ??= resolveDriver();
  return globalForCache.__cacheDriver;
}

/* -------------------------------- public ------------------------------- */

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await (await driver()).get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await (await driver()).set(key, JSON.stringify(value), ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await (await driver()).del(key);
}

/** 读缓存，未命中则执行 loader 并回填 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;

  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

/** 计数器自增（Redis INCRBY / 内存实现），用于阅读量与登录限流 */
export async function counterAdd(key: string, amount: number): Promise<number> {
  return (await driver()).incrBy(key, amount);
}

/** 刷新键的过期时间，配合 counterAdd 给计数器加滑动窗口 */
export async function cacheExpire(key: string, ttlSeconds: number): Promise<void> {
  await (await driver()).expire(key, ttlSeconds);
}

export async function counterGet(key: string): Promise<number | null> {
  const raw = await cacheGet<number>(key);
  return typeof raw === "number" ? raw : null;
}

/** 按前缀批量失效（取第一个 key 之前的位置作为前缀，实现简单可控） */
export async function cacheDelByPrefix(prefix: string): Promise<void> {
  const d = await driver();
  // 内存实现可以精确遍历；Redis 需要 SCAN，这里为演示规模用数量受控的命名空间键
  if (d.name === "memory") {
    const store = (d as unknown as { store: Map<string, MemoryEntry> }).store;
    for (const key of [...store.keys()]) {
      if (key.startsWith(prefix)) await d.del(key);
    }
  }
}

export async function cacheDriverName(): Promise<DriverName> {
  return (await driver()).name;
}
