import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function AdminChat() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyMutation = trpc.chat.reply.useMutation();
  const conversationsQuery = trpc.chat.conversations.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const messagesQuery = trpc.chat.messages.useQuery(
    { conversationId: selectedConv! },
    { enabled: !!selectedConv, refetchInterval: 5000 }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    try {
      await replyMutation.mutateAsync({
        conversationId: selectedConv,
        text: replyText.trim(),
      });
      setReplyText("");
      messagesQuery.refetch();
      conversationsQuery.refetch();
    } catch (err) {
      console.error("Reply failed:", err);
    }
  };

  const conversations = conversationsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];

  return (
    <AdminLayout title="Live Chat">
      <p className="text-sm text-muted-foreground mb-4">
        Customer conversations appear here in real time. When the bot can't answer a question, the customer is connected to you.
      </p>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-16rem)]">
        {/* Conversations list */}
        <div className="w-full md:w-64 shrink-0 bg-white border border-border rounded-lg overflow-y-auto max-h-48 md:max-h-none">
          {conversationsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No conversations yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map(conv => (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedConv(conv.conversationId)}
                  className={`w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors ${
                    selectedConv === conv.conversationId ? "bg-primary/5 border-l-2 border-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {conv.conversationId.slice(0, 8)}...
                    </span>
                    {conv.unread > 0 && (
                      <span className="h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-foreground truncate">{conv.lastMessage}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {conv.lastSender === "customer" ? "Customer" : conv.lastSender === "admin" ? "You" : "Bot"} ·{" "}
                    {new Date(conv.lastAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message thread */}
        <div className="flex-1 bg-white border border-border rounded-lg flex flex-col overflow-hidden">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="text-sm font-bold">Conversation {selectedConv.slice(0, 8)}...</div>
                <div className="text-xs text-muted-foreground">Customer chat session</div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "admin"
                          ? "bg-primary text-white rounded-br-md"
                          : msg.sender === "customer"
                          ? "bg-muted border border-border rounded-bl-md"
                          : "bg-amber-50 border border-amber-200 text-amber-800 rounded-bl-md"
                      }`}
                    >
                      <div className="text-[10px] font-bold mb-0.5 opacity-70">
                        {msg.sender === "admin" ? "You" : msg.sender === "customer" ? "Customer" : "Bot"}
                      </div>
                      {msg.text}
                      <div className="text-[10px] mt-1 opacity-50">
                        {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="px-4 py-3 border-t border-border shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    sendReply();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
