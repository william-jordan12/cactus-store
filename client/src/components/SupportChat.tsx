import { MessageCircle, X, Send, Headphones } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

type UiMessage = {
  id: number;
  sender: "user" | "admin" | "bot";
  text: string;
  time: string;
};

function getVisitorId(): string {
  const key = "store_chat_visitor_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getBotReply(msg: string): string | null {
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
  return null;
}

const WELCOME_MESSAGES: UiMessage[] = [
  {
    id: 1,
    sender: "bot",
    text: "Hi there! Welcome to Cactus Store support. How can we help you today?",
    time: "now",
  },
  {
    id: 2,
    sender: "bot",
    text: "You can ask us about orders, shipping, plant care, or anything else!",
    time: "now",
  },
];

const QUICK_REPLIES = [
  "Where is my order?",
  "Shipping info",
  "Plant care tips",
  "Return policy",
];

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>(WELCOME_MESSAGES);
  const [input, setInput] = useState("");
  const [visitorId] = useState(() => getVisitorId());
  const [lastPolledId, setLastPolledId] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendMutation = trpc.chat.send.useMutation();
  const pollQuery = trpc.chat.poll.useQuery(
    { conversationId: visitorId, afterId: lastPolledId || undefined },
    {
      refetchInterval: 3000,
      enabled: true,
    }
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setHasUnread(false);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const data = pollQuery.data;
    if (!data || data.length === 0) return;

    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const newMsgs: UiMessage[] = data
        .filter((m: any) => !existingIds.has(m.id))
        .map((m: any) => ({
          id: m.id,
          sender: m.sender === "customer" ? "user" : (m.sender as "admin" | "bot"),
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        }));
      if (newMsgs.length === 0) return prev;
      const maxId = Math.max(...data.map((m: any) => m.id));
      setLastPolledId(maxId);
      if (newMsgs.some(m => m.sender === "admin") && !open) {
        setHasUnread(true);
      }
      return [...prev, ...newMsgs];
    });
  }, [pollQuery.data, open]);

  const formatTime = () =>
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: UiMessage = {
      id: Date.now(),
      sender: "user",
      text: text.trim(),
      time: formatTime(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const botReply = getBotReply(text.trim());
    if (botReply) {
      const botMsg: UiMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: botReply,
        time: formatTime(),
      };
      setMessages(prev => [...prev, botMsg]);
    }

    try {
      await sendMutation.mutateAsync({
        conversationId: visitorId,
        text: text.trim(),
      });
      setTimeout(() => pollQuery.refetch(), 2000);
    } catch (err) {
      console.error("Chat send failed:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-5 z-[200] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          open
            ? "bg-foreground text-background rotate-0"
            : "bg-[oklch(0.47_0.11_155)] text-white"
        }`}
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && hasUnread && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            !
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[200] w-[360px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          style={{ height: "min(520px, calc(100vh - 8rem))" }}
        >
          <div className="bg-[oklch(0.47_0.11_155)] text-white px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">Customer Support</div>
              <div className="text-white/70 text-xs">We typically reply within minutes</div>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[oklch(0.985_0.002_155)]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[oklch(0.47_0.11_155)] text-white rounded-br-md"
                      : "bg-white text-foreground border border-border shadow-sm rounded-bl-md"
                  }`}
                >
                  {msg.sender === "admin" && (
                    <div className="text-[10px] font-bold text-[oklch(0.47_0.11_155)] mb-0.5">Staff</div>
                  )}
                  {msg.text}
                  <div
                    className={`text-[10px] mt-1 ${
                      msg.sender === "user" ? "text-white/50" : "text-muted-foreground"
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 3 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border bg-white shrink-0">
              {QUICK_REPLIES.map(reply => (
                <button
                  key={reply}
                  onClick={() => send(reply)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[oklch(0.47_0.11_155)]/30 text-[oklch(0.47_0.11_155)] hover:bg-[oklch(0.47_0.11_155)]/5 transition-colors font-medium"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div className="px-3 py-3 border-t border-border bg-white shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm outline-none border border-border focus:border-[oklch(0.47_0.11_155)] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-10 w-10 rounded-full bg-[oklch(0.47_0.11_155)] text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
