import { and, desc, eq, gt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  chatMessages,
  InsertCategory,
  InsertChatMessage,
  InsertOrder,
  InsertOrderItem,
  InsertProduct,
  InsertReview,
  InsertUser,
  InsertVisit,
  orderItems,
  orders,
  products,
  reviews,
  settings,
  users,
  visits,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: any = null;

/** Race a promise against a timeout so a sleeping managed DB can't block us. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`DB operation timed out after ${ms}ms`)), ms);
    p.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

/** Ping the pool until the DB responds, handling managed-DB sleep/wake cycles. */
async function ensurePoolHealthy() {
  if (!_pool) return;
  for (let attempt = 0; attempt < 5; attempt++) {
    let conn: any;
    try {
      conn = await withTimeout(_pool.getConnection(), 25000);
      try {
        await withTimeout(conn.ping(), 25000);
      } finally {
        conn.release();
      }
      return;
    } catch (e: any) {
      console.warn(`[Database] Connection retry ${attempt + 1}:`, e?.message);
      try { conn?.release(); } catch {}
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const mysql = await import("mysql2/promise");
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionLimit: 5,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 30000,
        queryTimeout: 30000,
      });
      await ensurePoolHealthy();
      const conn = _pool;
      _db = drizzle(conn);
      // Auto-migrate: ensure core tables exist (recreate if DB was wiped)
      try {
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            openId VARCHAR(64) NOT NULL UNIQUE,
            name TEXT,
            email VARCHAR(320),
            loginMethod VARCHAR(64),
            role ENUM('user','admin') NOT NULL DEFAULT 'user',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(191) NOT NULL UNIQUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            imageUrl MEDIUMTEXT,
            images MEDIUMTEXT,
            priceCents INT NOT NULL,
            priceEndCents INT,
            inStock BOOLEAN NOT NULL DEFAULT TRUE,
            isVariable BOOLEAN NOT NULL DEFAULT FALSE,
            variants MEDIUMTEXT,
            categoryId INT,
            description TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
          )
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customerName VARCHAR(255),
            customerEmail VARCHAR(320),
            customerPhone VARCHAR(64),
            shippingAddress TEXT,
            billingAddress TEXT,
            paymentMethod VARCHAR(64),
            totalCents INT NOT NULL DEFAULT 0,
            paymentStatus ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
            stripeSessionId VARCHAR(255) UNIQUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
          )
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS orderItems (
            id INT AUTO_INCREMENT PRIMARY KEY,
            orderId INT NOT NULL,
            productId INT,
            title VARCHAR(255) NOT NULL,
            unitPriceCents INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1
          )
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            key VARCHAR(191) NOT NULL UNIQUE,
            value TEXT,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
          )
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            authorName VARCHAR(191) NOT NULL,
            rating INT NOT NULL DEFAULT 5,
            content TEXT NOT NULL,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `);
        console.log("[Database] Core tables verified");
      } catch (e: any) {
        console.warn("[Database] Core table migration:", e?.message);
      }
      // Auto-migrate: add images column if missing, upgrade to MEDIUMTEXT if needed
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM products LIKE 'images'");
        if ((cols as any[]).length === 0) {
          await conn.execute("ALTER TABLE products ADD COLUMN `images` MEDIUMTEXT AFTER `imageUrl`");
          console.log("[Database] Added 'images' column to products table");
        } else {
          const [colType] = await conn.execute("SHOW COLUMNS FROM products WHERE Field='images'");
          const type = (colType as any[])[0]?.Type?.toLowerCase() ?? "";
          if (type === "text") {
            await conn.execute("ALTER TABLE products MODIFY COLUMN `images` MEDIUMTEXT");
            console.log("[Database] Upgraded 'images' column to MEDIUMTEXT");
          }
        }
        const [urlCol] = await conn.execute("SHOW COLUMNS FROM products WHERE Field='imageUrl'");
        const urlType = (urlCol as any[])[0]?.Type?.toLowerCase() ?? "";
        if (urlType === "text") {
          await conn.execute("ALTER TABLE products MODIFY COLUMN `imageUrl` MEDIUMTEXT");
          console.log("[Database] Upgraded 'imageUrl' column to MEDIUMTEXT");
        }
      } catch (e: any) {
        console.warn("[Database] images column migration:", e?.message);
      }
      // Auto-migrate: create chatMessages table if missing
      try {
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS chatMessages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversationId VARCHAR(64) NOT NULL,
            sender ENUM('customer','admin','bot') NOT NULL,
            text TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            INDEX idx_chat_conv (conversationId),
            INDEX idx_chat_created (createdAt)
          )
        `);
      } catch (e: any) {
        console.warn("[Database] chatMessages migration:", e?.message);
      }
      // Auto-migrate: create visits table if missing
      try {
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS visits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            visitorId VARCHAR(64) NOT NULL,
            path VARCHAR(500) NOT NULL DEFAULT '/',
            userAgent VARCHAR(500) NULL,
            ip VARCHAR(64) NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            INDEX idx_visits_visitor (visitorId),
            INDEX idx_visits_created (createdAt)
          )
        `);
      } catch (e: any) {
        console.warn("[Database] visits migration:", e?.message);
      }
      // Auto-migrate: add priceEndCents and inStock columns if missing
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM products LIKE 'priceEndCents'");
        if ((cols as any[]).length === 0) {
          await conn.execute("ALTER TABLE products ADD COLUMN `priceEndCents` INT NULL AFTER `priceCents`");
          console.log("[Database] Added 'priceEndCents' column to products table");
        }
      } catch (e: any) {
        console.warn("[Database] priceEndCents migration:", e?.message);
      }
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM products LIKE 'inStock'");
        if ((cols as any[]).length === 0) {
          await conn.execute("ALTER TABLE products ADD COLUMN `inStock` BOOLEAN NOT NULL DEFAULT TRUE AFTER `priceEndCents`");
          console.log("[Database] Added 'inStock' column to products table");
        }
      } catch (e: any) {
        console.warn("[Database] inStock migration:", e?.message);
      }
      // Auto-migrate: add isVariable and variants columns if missing
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM products LIKE 'isVariable'");
        if ((cols as any[]).length === 0) {
          await conn.execute("ALTER TABLE products ADD COLUMN `isVariable` BOOLEAN NOT NULL DEFAULT FALSE AFTER `inStock`");
          console.log("[Database] Added 'isVariable' column to products table");
        }
      } catch (e: any) {
        console.warn("[Database] isVariable migration:", e?.message);
      }
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM products LIKE 'variants'");
        if ((cols as any[]).length === 0) {
          await conn.execute("ALTER TABLE products ADD COLUMN `variants` MEDIUMTEXT NULL AFTER `isVariable`");
          console.log("[Database] Added 'variants' column to products table");
        }
      } catch (e: any) {
        console.warn("[Database] variants migration:", e?.message);
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/** Returns a raw mysql2 connection from the shared pool (used by bootstrap/seeding). */
export async function getRawConnection() {
  if (!process.env.DATABASE_URL) return null;
  try {
    await ensurePoolHealthy();
    if (_pool) return await withTimeout(_pool.getConnection(), 25000);
    const mysql = await import("mysql2/promise");
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionLimit: 3,
      connectTimeout: 30000,
      queryTimeout: 30000,
    });
    _pool = pool;
    return await withTimeout(pool.getConnection(), 25000);
  } catch (e) {
    console.warn("[Database] getRawConnection failed:", e);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(categories).values(data);
  return result.insertId;
}

export async function updateCategory(id: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set({ name }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Detach products from the category rather than deleting them.
  await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function listProducts() {
  const db = await getDb();
  if (!db) return [];
  // Select explicit columns, excluding the heavy `images` MEDIUMTEXT column,
  // which made the public store.products query time out during serialization.
  return db
    .select({
      id: products.id,
      title: products.title,
      imageUrl: products.imageUrl,
      description: products.description,
      priceCents: products.priceCents,
      priceEndCents: products.priceEndCents,
      inStock: products.inStock,
      isVariable: products.isVariable,
      variants: products.variants,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .orderBy(desc(products.createdAt));
}

/** Lightweight product list for admin (excludes heavy images/variants columns). */
export async function listProductsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: products.id,
    title: products.title,
    imageUrl: products.imageUrl,
    priceCents: products.priceCents,
    priceEndCents: products.priceEndCents,
    inStock: products.inStock,
    isVariable: products.isVariable,
    categoryId: products.categoryId,
    description: products.description,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(products).values(data);
    return result.insertId;
  } catch (e: any) {
    if (e?.code === "ER_BAD_FIELD_ERROR" && "images" in data) {
      const { images, ...rest } = data;
      const [result] = await db.insert(products).values(rest as any);
      return result.insertId;
    }
    throw e;
  }
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(products).set(data).where(eq(products.id, id));
  } catch (e: any) {
    if (e?.code === "ER_BAD_FIELD_ERROR" && "images" in data) {
      const { images, ...rest } = data;
      await db.update(products).set(rest as any).where(eq(products.id, id));
    } else {
      throw e;
    }
  }
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(orders).values(order);
  const orderId = result.insertId;
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(item => ({ ...item, orderId })));
  }
  return orderId;
}

export async function getOrderByStripeSessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
  return rows[0];
}

export async function updateOrderByStripeSessionId(
  sessionId: string,
  data: Partial<InsertOrder>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(data).where(eq(orders.stripeSessionId, sessionId));
}

export async function listOrdersWithItems() {
  const db = await getDb();
  if (!db) return [];
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const allItems = await db.select().from(orderItems);
  return allOrders.map(order => ({
    ...order,
    items: allItems.filter(item => item.orderId === order.id),
  }));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value ?? "";
  }
  return map;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(settings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(reviews).values(data);
  return result.insertId;
}

export async function listApprovedReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt));
}

export async function listAllReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).orderBy(desc(reviews.createdAt));
}

export async function updateReviewStatus(id: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function deleteChatConversation(conversationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(chatMessages).where(eq(chatMessages.conversationId, conversationId));
}

export async function sendChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(chatMessages).values(data);
  return result.insertId;
}

export async function getChatMessages(conversationId: string, afterId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(chatMessages.conversationId, conversationId)];
  if (afterId) {
    conditions.push(gt(chatMessages.id, afterId));
  }
  return db
    .select()
    .from(chatMessages)
    .where(and(...conditions))
    .orderBy(chatMessages.createdAt);
}

export async function listChatConversations() {
  const db = await getDb();
  if (!db) return [];

  // Get the most recent message per conversation using a subquery approach
  const latestPerConv = await db.execute(`
    SELECT conversationId, MAX(id) as maxId
    FROM chatMessages
    GROUP BY conversationId
    ORDER BY maxId DESC
    LIMIT 50
  `);

  const convIds = (latestPerConv as any[]).map((r: any) => r.maxId);
  if (convIds.length === 0) return [];

  const latestMessages = await db
    .select()
    .from(chatMessages)
    .where(or(...convIds.map((id: number) => eq(chatMessages.id, id))));

  // Count unread customer messages per conversation
  const unreadRows = await db.execute(`
    SELECT conversationId, COUNT(*) as cnt
    FROM chatMessages
    WHERE sender = 'customer'
      AND id > (
        SELECT COALESCE(MAX(id), 0)
        FROM chatMessages
        WHERE sender IN ('admin', 'bot')
          AND conversationId = chatMessages.conversationId
      )
    GROUP BY conversationId
  `);

  const unreadMap = new Map<string, number>();
  for (const row of unreadRows as any[]) {
    unreadMap.set(row.conversationId, Number(row.cnt));
  }

  const msgMap = new Map(latestMessages.map(m => [m.id, m]));

  return (latestPerConv as any[])
    .map((row: any) => {
      const msg = msgMap.get(row.maxId);
      if (!msg) return null;
      return {
        conversationId: msg.conversationId,
        lastMessage: msg.text,
        lastSender: msg.sender,
        lastAt: msg.createdAt,
        unread: unreadMap.get(msg.conversationId) ?? 0,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.lastAt.getTime() - a.lastAt.getTime());
}

// ---------------------------------------------------------------------------
// Visits
// ---------------------------------------------------------------------------

export async function recordVisit(data: InsertVisit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(visits).values(data);
  return result.insertId;
}

/** True if this visitorId has been seen within the last `withinMs` window. */
export async function hasVisitorSeenWithin(visitorId: string, withinMs: number) {
  const db = await getDb();
  if (!db) return false;
  const cutoff = new Date(Date.now() - withinMs);
  const rows = await db
    .select({ id: visits.id })
    .from(visits)
    .where(and(eq(visits.visitorId, visitorId), gt(visits.createdAt, cutoff)))
    .limit(1);
  return rows.length > 0;
}

export async function listRecentVisits(limit = 25) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(visits)
    .orderBy(desc(visits.createdAt))
    .limit(limit);
}

export async function countUniqueVisitorsSince(sinceMs: number) {
  const db = await getDb();
  if (!db) return 0;
  const cutoff = new Date(Date.now() - sinceMs);
  const rows = await db
    .select({ visitorId: visits.visitorId })
    .from(visits)
    .where(gt(visits.createdAt, cutoff));
  return new Set(rows.map(r => r.visitorId)).size;
}
