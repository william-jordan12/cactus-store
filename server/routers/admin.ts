import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

/** Only users with role=admin may access management procedures. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const productInput = z.object({
  title: z.string().trim().min(1).max(255),
  imageUrl: z.string().trim().max(10_000_000).nullish(),
  images: z.array(z.string().trim().max(10_000_000)).nullish(),
  priceCents: z.number().int().min(0),
  priceEndCents: z.number().int().min(0).nullish(),
  inStock: z.boolean().optional().default(true),
  categoryId: z.number().int().positive().nullish(),
  description: z.string().trim().max(10000).nullish(),
});

export const adminRouter = router({
  /** Products CRUD */
  products: router({
    list: adminProcedure.query(() => db.listProducts()),
    uploadImage: adminProcedure
      .input(z.object({ data: z.string().min(1), filename: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { data, filename } = input;
        const match = data.match(/^data:(.+);base64,(.+)$/);
        if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid base64 data" });
        const contentType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        const ext = filename.split(".").pop() || "jpg";
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "");
        const key = `products/${safeName}_${Date.now()}.${ext}`;
        try {
          if (ENV.forgeApiUrl && ENV.forgeApiKey) {
            const result = await storagePut(key, buffer, contentType);
            return { url: result.url };
          }
        } catch (e) {
          console.warn("[Upload] Forge storage failed, falling back to data URL:", e);
        }
        return { url: data };
      }),
    create: adminProcedure.input(productInput).mutation(async ({ input }) => {
      const images = input.images?.filter(Boolean) ?? [];
      const imageUrl = input.imageUrl ?? images[0] ?? null;
      const id = await db.createProduct({
        title: input.title,
        imageUrl,
        images: JSON.stringify(images),
        priceCents: input.priceCents,
        priceEndCents: input.priceEndCents ?? null,
        inStock: input.inStock ?? true,
        categoryId: input.categoryId ?? null,
        description: input.description ?? null,
      });
      return { id };
    }),
    update: adminProcedure
      .input(productInput.extend({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const images = data.images?.filter(Boolean) ?? [];
        const imageUrl = data.imageUrl ?? images[0] ?? null;
        await db.updateProduct(id, {
          title: data.title,
          imageUrl,
          images: JSON.stringify(images),
          priceCents: data.priceCents,
          priceEndCents: data.priceEndCents ?? null,
          inStock: data.inStock ?? true,
          categoryId: data.categoryId ?? null,
          description: data.description ?? null,
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
  }),

  /** Categories management */
  categories: router({
    list: adminProcedure.query(() => db.listCategories()),
    create: adminProcedure
      .input(z.object({ name: z.string().trim().min(1).max(191) }))
      .mutation(async ({ input }) => {
        const id = await db.createCategory({ name: input.name });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(191) }))
      .mutation(async ({ input }) => {
        await db.updateCategory(input.id, input.name);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
  }),

  /** Orders tracker */
  orders: router({
    list: adminProcedure.query(() => db.listOrdersWithItems()),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteOrder(input.id);
        return { success: true };
      }),
  }),

  /** Review moderation */
  reviews: router({
    list: adminProcedure.query(() => db.listAllReviews()),
    setStatus: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(["pending", "approved", "rejected"]),
        }),
      )
      .mutation(async ({ input }) => {
        await db.updateReviewStatus(input.id, input.status);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteReview(input.id);
        return { success: true };
      }),
  }),

  /** Store settings */
  settings: router({
    get: adminProcedure.query(async () => {
      const all = await db.getAllSettings();
      return {
        whatsappNumber: all.whatsappNumber ?? "650294923",
        contactEmail: all.contactEmail || "peyoteseedsfarm@gmail.com",
        storeName: all.storeName ?? "Peyote Seeds Farm",
        onlinePaymentsEnabled: all.onlinePaymentsEnabled === "true",
      };
    }),
    update: adminProcedure
      .input(
        z.object({
          whatsappNumber: z.string().trim().max(32).optional(),
          contactEmail: z.union([z.string().trim().email().max(320), z.literal("")]).optional(),
          storeName: z.string().trim().min(1).max(191).optional(),
          onlinePaymentsEnabled: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.whatsappNumber !== undefined) {
          await db.setSetting("whatsappNumber", input.whatsappNumber.replace(/[^0-9+]/g, ""));
        }
        if (input.contactEmail !== undefined) {
          await db.setSetting("contactEmail", input.contactEmail);
        }
        if (input.storeName !== undefined) {
          await db.setSetting("storeName", input.storeName);
        }
        if (input.onlinePaymentsEnabled !== undefined) {
          await db.setSetting("onlinePaymentsEnabled", input.onlinePaymentsEnabled ? "true" : "false");
        }
        return { success: true };
      }),
  }),
});
