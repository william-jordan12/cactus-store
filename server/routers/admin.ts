import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";

/** Only users with role=admin may access management procedures. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const productInput = z.object({
  title: z.string().trim().min(1).max(255),
  imageUrl: z.string().trim().max(2000).nullish(),
  priceCents: z.number().int().min(0),
  categoryId: z.number().int().positive().nullish(),
  description: z.string().trim().max(10000).nullish(),
});

export const adminRouter = router({
  /** Products CRUD */
  products: router({
    list: adminProcedure.query(() => db.listProducts()),
    create: adminProcedure.input(productInput).mutation(async ({ input }) => {
      const id = await db.createProduct({
        title: input.title,
        imageUrl: input.imageUrl ?? null,
        priceCents: input.priceCents,
        categoryId: input.categoryId ?? null,
        description: input.description ?? null,
      });
      return { id };
    }),
    update: adminProcedure
      .input(productInput.extend({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, {
          title: data.title,
          imageUrl: data.imageUrl ?? null,
          priceCents: data.priceCents,
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
