import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { streamChat, type Message } from "@/lib/chat";
import { toast } from "sonner";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          toast.error(msg);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Failed to connect to AI");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">AI Assistant</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">How can I help you today?</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Ask me anything — from coding questions to learning concepts. I'm here to help.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={send} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
