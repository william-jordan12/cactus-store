import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const chatSenderEnum = pgEnum("chat_sender", ["customer", "admin", "bot"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** OpenID identifier returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Product categories managed by the admin. */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 191 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/** Store products. Price stored in cents (integer) to avoid float issues. */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length:255 }).notNull(),
  imageUrl: text("imageUrl"),
  images: text("images"),
  priceCents: integer("priceCents").notNull(),
  priceEndCents: integer("priceEndCents"),
  inStock: boolean("inStock").default(true).notNull(),
  isVariable: boolean("isVariable").default(false).notNull(),
  variants: text("variants"),
  categoryId: integer("categoryId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/** Payment methods offered at checkout. */
export const PAYMENT_METHODS = [
  "Cash App",
  "PayPal",
  "Venmo",
  "Zelle",
  "Bitcoin",
  "Apple Pay",
  "Chime",
  "Bank transfer",
  "Cryptocurrency",
  "Wire transfer",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Orders created by online checkout. */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 64 }),
  shippingAddress: text("shippingAddress"),
  billingAddress: text("billingAddress"),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  totalCents: integer("totalCents").notNull().default(0),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/** Line items belonging to an order. Snapshot of product data at purchase time. */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId"),
  title: varchar("title", { length: 255 }).notNull(),
  unitPriceCents: integer("unitPriceCents").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/** Key-value store settings editable from the admin panel. */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 191 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/** Customer-submitted reviews, moderated by the admin before display. */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  authorName: varchar("authorName", { length: 191 }).notNull(),
  rating: integer("rating").notNull().default(5),
  content: text("content").notNull(),
  status: reviewStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/** Live chat messages between customers and admin. */
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  sender: chatSenderEnum("sender").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/** Anonymous visit events used to notify the owner about new site traffic. */
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  path: varchar("path", { length: 500 }).notNull().default("/"),
  userAgent: varchar("userAgent", { length: 500 }),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = typeof visits.$inferInsert;
