import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests run without a live database.
vi.mock("./db", () => ({
  listProducts: vi.fn(),
  getProductById: vi.fn(),
  listCategories: vi.fn(),
  getAllSettings: vi.fn(),
  createOrder: vi.fn(),
  getOrderByStripeSessionId: vi.fn(),
  updateOrderByStripeSessionId: vi.fn(),
  listOrdersWithItems: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  setSetting: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";

function publicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    title: "Lophophora Williamsii 4cm",
    imageUrl: null,
    priceCents: 3500,
    categoryId: 1,
    description: "A healthy cactus plant",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: "Germination Kit",
    imageUrl: null,
    priceCents: 2000,
    categoryId: 2,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("store.products", () => {
  it("returns all products with no filters", async () => {
    vi.mocked(db.listProducts).mockResolvedValue(SAMPLE_PRODUCTS);
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.store.products({});
    expect(result).toHaveLength(2);
  });

  it("filters by category", async () => {
    vi.mocked(db.listProducts).mockResolvedValue(SAMPLE_PRODUCTS);
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.store.products({ categoryId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Lophophora Williamsii 4cm");
  });

  it("filters by search term (title or description)", async () => {
    vi.mocked(db.listProducts).mockResolvedValue(SAMPLE_PRODUCTS);
    const caller = appRouter.createCaller(publicCtx());
    const byTitle = await caller.store.products({ search: "germination" });
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0]?.id).toBe(2);
    const byDesc = await caller.store.products({ search: "healthy" });
    expect(byDesc).toHaveLength(1);
    expect(byDesc[0]?.id).toBe(1);
  });
});

describe("store.settings", () => {
  it("exposes the default WhatsApp number and store settings", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({
      whatsappNumber: "650294923",
      contactEmail: "",
      storeName: "Peyote Seeds Farm",
      onlinePaymentsEnabled: "true",
    });
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.store.settings();
    expect(result.whatsappNumber).toBe("650294923");
    expect(result.storeName).toBe("Peyote Seeds Farm");
  });

  it("keeps the payments toggle on without Stripe keys, but reports Stripe as unconfigured", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({ onlinePaymentsEnabled: "true" });
    const hadKey = process.env.STRIPE_SECRET_KEY;
    const hadStoreKey = process.env.STORE_STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STORE_STRIPE_SECRET_KEY;
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.store.settings();
    expect(result.onlinePaymentsEnabled).toBe(true);
    expect(result.stripeConfigured).toBe(false);
    if (hadKey) process.env.STRIPE_SECRET_KEY = hadKey;
    if (hadStoreKey) process.env.STORE_STRIPE_SECRET_KEY = hadStoreKey;
  });
});

describe("store.createCheckoutSession", () => {
  it("rejects when online payments are disabled in settings", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({ onlinePaymentsEnabled: "false" });
    const caller = appRouter.createCaller(publicCtx());
    await expect(
      caller.store.createCheckoutSession({ items: [{ productId: 1, quantity: 1 }] }),
    ).rejects.toThrow(/disabled/i);
  });
});

describe("store.createEmailPaymentRequest", () => {
  it("logs a pending order and returns the contact email with re-priced items", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({
      onlinePaymentsEnabled: "true",
      contactEmail: "peyoteseedsfarm@gmail.com",
    });
    vi.mocked(db.getProductById).mockResolvedValue(SAMPLE_PRODUCTS[0]);
    vi.mocked(db.createOrder).mockResolvedValue(11);
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.store.createEmailPaymentRequest({
      items: [{ productId: 1, quantity: 2 }],
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
    });
    expect(result.contactEmail).toBe("peyoteseedsfarm@gmail.com");
    expect(result.totalCents).toBe(7000);
    expect(result.items[0]?.unitPriceCents).toBe(3500);
    expect(db.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        totalCents: 7000,
        paymentStatus: "pending",
        stripeSessionId: null,
      }),
      expect.arrayContaining([
        expect.objectContaining({ productId: 1, quantity: 2, unitPriceCents: 3500 }),
      ]),
    );
  });

  it("falls back to the default contact email when unset", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({ onlinePaymentsEnabled: "true" });
    vi.mocked(db.getProductById).mockResolvedValue(SAMPLE_PRODUCTS[1]);
    vi.mocked(db.createOrder).mockResolvedValue(12);
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.store.createEmailPaymentRequest({
      items: [{ productId: 2, quantity: 1 }],
    });
    expect(result.contactEmail).toBe("peyoteseedsfarm@gmail.com");
  });

  it("rejects when online payments are disabled", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({ onlinePaymentsEnabled: "false" });
    const caller = appRouter.createCaller(publicCtx());
    await expect(
      caller.store.createEmailPaymentRequest({ items: [{ productId: 1, quantity: 1 }] }),
    ).rejects.toThrow(/disabled/i);
  });
});
