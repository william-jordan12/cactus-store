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
      const msgId = await db.sendChatMessage({
        conversationId: input.conversationId,
        sender: "customer",
        text: input.text,
      });

      return { success: true, id: msgId } as const;
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

  // Admin: delete an entire conversation
  deleteConversation: adminProcedure
    .input(z.object({ conversationId: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      await db.deleteChatConversation(input.conversationId);
      return { success: true };
    }),
});
