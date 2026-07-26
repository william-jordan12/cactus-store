import { z } from "zod";
import { and } from "drizzle-orm";
import * as db from "../db";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

export const chatRouter = router({
  // Customer sends a message
  send: publicProcedure
    .input(
      z.object({
        conversationId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9-]+$/),
        text: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      await db.sendChatMessage({
        conversationId: input.conversationId,
        sender: "customer",
        text: input.text,
      });

      // Check if the bot can handle this — if not, escalate to human
      const lower = input.text.toLowerCase();
      const canHandle =
        lower.includes("order") || lower.includes("track") ||
        lower.includes("ship") || lower.includes("return") ||
        lower.includes("refund") || lower.includes("care") ||
        lower.includes("water") || lower.includes("light") ||
        lower.includes("seed") || lower.includes("germ") ||
        lower.includes("hello") || lower.includes("hi") ||
        lower.includes("hey") || lower.includes("payment") ||
        lower.includes("pay") || lower.includes("cancel");

      if (!canHandle) {
        // Notify admin that a customer needs help
        try {
          const { notifyOwner } = await import("../_core/notification");
          await notifyOwner({
            title: "Live Chat - Customer Needs Help",
            content: `Customer asked: "${input.text.slice(0, 100)}"`,
          });
        } catch {
          // Notification is best-effort
        }
      }

      return { success: true } as const;
    }),

  // Customer polls for new messages (admin replies)
  poll: publicProcedure
    .input(
      z.object({
        conversationId: z.string().min(1).max(64),
        afterId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getChatMessages(input.conversationId, input.afterId);
    }),

  // Admin: list all conversations
  conversations: adminProcedure.query(async () => {
    return db.listChatConversations();
  }),

  // Admin: get messages for a conversation
  messages: adminProcedure
    .input(z.object({ conversationId: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return db.getChatMessages(input.conversationId);
    }),

  // Admin: send a reply
  reply: adminProcedure
    .input(
      z.object({
        conversationId: z.string().min(1).max(64),
        text: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      await db.sendChatMessage({
        conversationId: input.conversationId,
        sender: "admin",
        text: input.text,
      });
      return { success: true };
    }),
});
