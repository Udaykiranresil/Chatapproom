import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";
import EndChatModal from "../components/EndChatModal";
import TwinOrbit from "../components/TwinOrbit";
import { supabase } from "../lib/supabaseClient";
import { useRoomPresence } from "../hooks/useRoomPresence";

export default function ChatRoom({ room, userId, participantIds }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const scrollRef = useRef(null);

  const onlineIds = useRoomPresence(room.id, userId);
  const partnerId = participantIds.find((id) => id !== userId);
  const partnerOnline = partnerId ? onlineIds.includes(partnerId) : false;

  // Load existing messages once, then stream new ones in realtime.
  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true });

      if (!cancelled && !error) {
        setMessages(data);
      }
      if (!cancelled) setLoadingHistory(false);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages:${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        (payload) => {
          setMessages((curr) => (curr.some((m) => m.id === payload.new.id) ? curr : [...curr, payload.new]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  // Always keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(type, content) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ room_id: room.id, sender_id: userId, type, content })
      .select()
      .single();

    if (!error && data) {
      setMessages((curr) => (curr.some((m) => m.id === data.id) ? curr : [...curr, data]));
    }
  }

  async function handleEndChat() {
    setEnding(true);
    setDissolving(true);
    // Deleting the room cascades to its messages and participants (see schema.sql),
    // and fires a realtime DELETE event that ends the room for the other person too.
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    if (error) {
      setEnding(false);
      setDissolving(false);
      setEndModalOpen(false);
      return;
    }
    setTimeout(() => navigate("/"), 550);
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-void">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-glass-border bg-surface/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <TwinOrbit connected size={36} />
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold truncate">Private room</p>
            <p className="text-xs text-mist font-mono truncate flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  partnerOnline ? "bg-signal" : "bg-mist/40"
                }`}
              />
              {partnerOnline ? "Partner is here" : "Partner is offline"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEndModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-ember bg-ember/10 hover:bg-ember/20 px-3.5 sm:px-4 py-2 rounded-full transition-colors focus-ring"
        >
          <span className="hidden sm:inline">End chat</span>
          <span className="sm:hidden">End</span>
        </button>
      </header>

      {!partnerOnline && (
        <div className="bg-ember/10 border-b border-ember/20 text-ember text-xs text-center py-1.5 px-4">
          The other person isn't connected right now. Your messages will be waiting when they return.
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-2.5">
        {loadingHistory ? (
          <div className="flex justify-center pt-10">
            <TwinOrbit size={36} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-mist text-sm">
              This is the start of your room. Nothing sent here is saved once
              the chat ends.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} isOwn={m.sender_id === userId} dissolving={dissolving} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <ChatInput
        onSendText={(text) => sendMessage("text", text)}
        onSendEmoji={(emoji) => sendMessage("emoji", emoji)}
        onSendGif={(url) => sendMessage("gif", url)}
        disabled={ending}
      />

      <EndChatModal
        open={endModalOpen}
        busy={ending}
        onConfirm={handleEndChat}
        onCancel={() => setEndModalOpen(false)}
      />
    </div>
  );
}
