import { z } from "zod";
import { eq } from "drizzle-orm";
import * as db from "../db";
import { chatMessages } from "../../drizzle/schema";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

// Simple bot auto-reply logic
function getAutoReply(msg: string): string | null {
  const lower = msg.toLowerCase();
  if (lower.includes("order") || lower.includes("track"))
    return "You can track your order using the tracking link sent to your email. If you can't find it, share your order number and we'll look it up.";
  if (lower.includes("ship"))
    return "We ship worldwide! Domestic orders arrive in 5-7 business days. International orders take 7-21 days. All plants are packed with care for safe transit.";
  if (lower.includes("return") || lower.includes("refund"))
    return "Due to the living nature of our products, we don't accept returns on live plants. If your order arrives damaged, contact us within 48 hours with photos and we'll make it right.";
  if (lower.includes("care") || lower.includes("water") || lower.includes("light"))
    return "Most cacti love bright, indirect light and well-draining soil. Water only when the soil is completely dry. In winter, reduce watering significantly. Each order includes a species-specific care card!";
  if (lower.includes("seed") || lower.includes("germ"))
    return "Our seeds are freshly harvested and tested for viability. Most species germinate within 7-14 days in warm conditions. Check the care card included with your order for specific instructions.";
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
    return "Hello! Great to have you here. What can we help you with today?";
  if (lower.includes("payment") || lower.includes("pay"))
    return "We accept Cash App, PayPal, Venmo, Zelle, Bitcoin, Apple Pay, Chime, bank transfers, and wire transfers. Choose your preferred method at checkout.";
  if (lower.includes("cancel"))
    return "To cancel an order, please contact us as soon as possible. If the order hasn't shipped yet, we can cancel it for you.";
  // Return null = escalate to human
  return null;
}

export const chatRouter = router({
  // Customer sends a message
  send: publicProcedure
    .input(
      z.object({
        conversationId: z.string().min(1).max(64),
        text: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      // Save customer message
      await db.sendChatMessage({
        conversationId: input.conversationId,
        sender: "customer",
        text: input.text,
      });

      // Try auto-reply
      const autoReply = getAutoReply(input.text);
      if (autoReply) {
        await db.sendChatMessage({
          conversationId: input.conversationId,
          sender: "bot",
          text: autoReply,
        });
        return { escalated: false };
      }

      // Escalate to human - send notification to admin
      await db.sendChatMessage({
        conversationId: input.conversationId,
        sender: "bot",
        text: "Let me connect you with our team. They'll get back to you shortly.",
      });

      // Notify admin via the notification system
      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: "Live Chat - Customer Needs Help",
          content: `A customer in chat (${input.conversationId.slice(0, 8)}...) asked: "${input.text.slice(0, 100)}"`,
        });
      } catch {
        // Notification is best-effort
      }

      return { escalated: true };
    }),

  // Customer polls for new messages
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
