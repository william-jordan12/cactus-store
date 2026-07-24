import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

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

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function ctxWithRole(role: "admin" | "user" | null): TrpcContext {
  const user: AuthenticatedUser | null = role
    ? {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin access control", () => {
  it("rejects unauthenticated visitors", async () => {
    const caller = appRouter.createCaller(ctxWithRole(null));
    await expect(caller.admin.products.list()).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(ctxWithRole("user"));
    await expect(caller.admin.products.list()).rejects.toThrow(/admin/i);
  });

  it("allows admin users", async () => {
    vi.mocked(db.listProducts).mockResolvedValue([]);
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    await expect(caller.admin.products.list()).resolves.toEqual([]);
  });
});

describe("admin.products CRUD", () => {
  it("creates a product with all fields", async () => {
    vi.mocked(db.createProduct).mockResolvedValue(42);
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    const result = await caller.admin.products.create({
      title: "Test Cactus",
      imageUrl: "https://example.com/img.jpg",
      priceCents: 1999,
      categoryId: 3,
      description: "A nice cactus",
    });
    expect(result.id).toBe(42);
    expect(db.createProduct).toHaveBeenCalledWith({
      title: "Test Cactus",
      imageUrl: "https://example.com/img.jpg",
      priceCents: 1999,
      categoryId: 3,
      description: "A nice cactus",
    });
  });

  it("updates and deletes products", async () => {
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    await caller.admin.products.update({
      id: 5,
      title: "Updated",
      priceCents: 500,
      imageUrl: null,
      categoryId: null,
      description: null,
    });
    expect(db.updateProduct).toHaveBeenCalledWith(5, expect.objectContaining({ title: "Updated" }));
    await caller.admin.products.delete({ id: 5 });
    expect(db.deleteProduct).toHaveBeenCalledWith(5);
  });

  it("rejects invalid product input", async () => {
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    await expect(
      caller.admin.products.create({ title: "", priceCents: -1 } as never),
    ).rejects.toThrow();
  });
});

describe("admin.categories", () => {
  it("creates, renames, and deletes categories", async () => {
    vi.mocked(db.createCategory).mockResolvedValue(7);
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    const created = await caller.admin.categories.create({ name: "Seeds" });
    expect(created.id).toBe(7);
    await caller.admin.categories.update({ id: 7, name: "Cactus Seeds" });
    expect(db.updateCategory).toHaveBeenCalledWith(7, "Cactus Seeds");
    await caller.admin.categories.delete({ id: 7 });
    expect(db.deleteCategory).toHaveBeenCalledWith(7);
  });
});

describe("admin.settings", () => {
  it("updates WhatsApp number, email, and payments toggle", async () => {
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    await caller.admin.settings.update({
      whatsappNumber: "+237 650 294 923",
      contactEmail: "owner@store.com",
      onlinePaymentsEnabled: false,
    });
    // Number is normalized to digits (and optional +)
    expect(db.setSetting).toHaveBeenCalledWith("whatsappNumber", "+237650294923");
    expect(db.setSetting).toHaveBeenCalledWith("contactEmail", "owner@store.com");
    expect(db.setSetting).toHaveBeenCalledWith("onlinePaymentsEnabled", "false");
  });

  it("returns defaults when settings are empty", async () => {
    vi.mocked(db.getAllSettings).mockResolvedValue({});
    const caller = appRouter.createCaller(ctxWithRole("admin"));
    const result = await caller.admin.settings.get();
    expect(result.whatsappNumber).toBe("650294923");
    expect(result.onlinePaymentsEnabled).toBe(false);
  });
});

