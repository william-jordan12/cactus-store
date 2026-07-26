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
  orderItems,
  orders,
  products,
  reviews,
  settings,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const mysql = await import("mysql2/promise");
      const conn = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(conn);
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
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
  return db.select().from(products).orderBy(desc(products.createdAt));
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
