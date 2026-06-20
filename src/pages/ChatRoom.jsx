import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";
import EndChatModal from "../components/EndChatModal";
import TwinOrbit from "../components/TwinOrbit";
import { supabase } from "../lib/supabaseClient";
import { useRoomPresence } from "../hooks/useRoomPresence";

// ─── tiny helpers ────────────────────────────────────────────────────────────

function formatRoomCode(code = "") {
  return code.toUpperCase();
}

function groupMessages(messages) {
  // Group consecutive messages from the same sender so we only show the
  // avatar / sender indicator on the last bubble in each run.
  const groups = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const isSameRun = prev && prev.sender_id === msg.sender_id;
    if (isSameRun) {
      groups[groups.length - 1].push(msg);
    } else {
      groups.push([msg]);
    }
  });
  return groups;
}

// ─── scroll-to-bottom button ─────────────────────────────────────────────────

function ScrollToBottomBtn({ show, onClick }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ duration: 0.18 }}
          onClick={onClick}
          aria-label="Scroll to latest message"
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-signal shadow-lg flex items-center justify-center text-white hover:bg-signal-dim transition-colors focus-ring"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── date separator ───────────────────────────────────────────────────────────

function DateSeparator({ date }) {
  const label = (() => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  })();

  return (
    <div className="flex items-center gap-3 my-3 px-1">
      <div className="flex-1 h-px bg-white/6" />
      <span className="text-[11px] font-mono text-mist/50 tracking-widest uppercase">{label}</span>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="h-full flex flex-col items-center justify-center text-center px-8 gap-3"
    >
      <div className="w-12 h-12 rounded-2xl bg-signal/10 flex items-center justify-center mb-1">
        <span className="text-2xl">💬</span>
      </div>
      <p className="font-display text-base font-semibold text-paper/80">Start the conversation</p>
      <p className="text-mist text-sm leading-relaxed max-w-xs">
        Nothing sent here is ever saved once the chat ends. It's just you two.
      </p>
    </motion.div>
  );
}

// ─── partner offline banner ───────────────────────────────────────────────────

function OfflineBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="bg-ember/10 border-b border-ember/20 text-ember text-xs text-center py-2 px-4 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-ember shrink-0" />
        Partner disconnected — messages will be waiting when they return
      </div>
    </motion.div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ChatRoom({ room, userId, participantIds }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const onlineIds = useRoomPresence(room.id, userId);
  const partnerId = participantIds.find((id) => id !== userId);
  const partnerOnline = partnerId ? onlineIds.includes(partnerId) : false;

  // ── scroll helpers ──────────────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
    setUnreadCount(0);
    setIsAtBottom(true);
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distFromBottom < 60;
    setIsAtBottom(atBottom);
    setShowScrollBtn(!atBottom);
    if (atBottom) setUnreadCount(0);
  }

  // ── message loading + realtime ──────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true });

      if (!cancelled && !error) setMessages(data);
      if (!cancelled) setLoadingHistory(false);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((curr) =>
            curr.some((m) => m.id === payload.new.id) ? curr : [...curr, payload.new]
          );
          // If the new message is from the partner and we're scrolled up, count it
          if (payload.new.sender_id !== userId) {
            setUnreadCount((n) => n + 1);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [room.id, userId]);

  // ── auto-scroll on new messages ─────────────────────────────────────────────

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const isOwnMessage = lastMsg?.sender_id === userId;
    // Always scroll for own messages; only auto-scroll for partner if at bottom
    if (isOwnMessage || isAtBottom) {
      scrollToBottom(loadingHistory ? "instant" : "smooth");
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── send message ────────────────────────────────────────────────────────────

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

  // ── end chat ────────────────────────────────────────────────────────────────

  async function handleEndChat() {
    setEnding(true);
    setDissolving(true);
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    if (error) {
      setEnding(false);
      setDissolving(false);
      setEndModalOpen(false);
      return;
    }
    setTimeout(() => navigate("/"), 550);
  }

  // ── build grouped messages with date separators ─────────────────────────────

  const renderedMessages = (() => {
    if (messages.length === 0) return null;
    const items = [];
    let lastDate = null;

    messages.forEach((msg, i) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== lastDate) {
        items.push(<DateSeparator key={`sep-${msg.id}`} date={msg.created_at} />);
        lastDate = msgDate;
      }
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const isFirstInRun = !prev || prev.sender_id !== msg.sender_id;
      const isLastInRun = !next || next.sender_id !== msg.sender_id;

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.sender_id === userId}
          dissolving={dissolving}
          isFirstInRun={isFirstInRun}
          isLastInRun={isLastInRun}
        />
      );
    });
    return items;
  })();

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-void">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-glass-border bg-surface/70 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3 min-w-0">
          <TwinOrbit connected size={34} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold text-paper truncate">Private room</p>
              <span className="hidden sm:inline text-[10px] font-mono text-mist/50 bg-white/5 border border-white/8 rounded px-1.5 py-0.5 tracking-widest">
                {formatRoomCode(room.code)}
              </span>
            </div>
            <p className="text-xs text-mist font-mono flex items-center gap-1.5 mt-0.5">
              <motion.span
                animate={{ opacity: partnerOnline ? [1, 0.4, 1] : 1 }}
                transition={{ duration: 2, repeat: partnerOnline ? Infinity : 0 }}
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  partnerOnline ? "bg-signal" : "bg-mist/30"
                }`}
              />
              {partnerOnline ? "Partner is here" : "Waiting for partner…"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEndModalOpen(true)}
          disabled={ending}
          className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-ember bg-ember/10 hover:bg-ember/20 active:scale-95 px-3.5 sm:px-4 py-2 rounded-full transition-all focus-ring disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">End chat</span>
          <span className="sm:hidden">End</span>
        </button>
      </header>

      {/* ── Offline banner ── */}
      <AnimatePresence>
        {!partnerOnline && !loadingHistory && <OfflineBanner />}
      </AnimatePresence>

      {/* ── Messages area ── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 sm:px-6 py-5 scroll-smooth"
        >
          {loadingHistory ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <TwinOrbit size={40} />
              <p className="text-mist text-sm font-mono animate-pulse">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-0.5">
              <AnimatePresence initial={false}>
                {renderedMessages}
              </AnimatePresence>
            </div>
          )}
          {/* invisible anchor for scrolling */}
          <div ref={bottomRef} className="h-px" />
        </div>

        {/* scroll-to-bottom button with unread badge */}
        <div className="absolute bottom-3 right-4 z-10">
          <ScrollToBottomBtn
            show={showScrollBtn}
            onClick={() => scrollToBottom("smooth")}
          />
          <AnimatePresence>
            {showScrollBtn && unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-ember text-white text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Chat input ── */}
      <div className="shrink-0">
        <ChatInput
          onSendText={(text) => sendMessage("text", text)}
          onSendEmoji={(emoji) => sendMessage("emoji", emoji)}
          onSendGif={(url) => sendMessage("gif", url)}
          disabled={ending}
        />
      </div>

      {/* ── End chat modal ── */}
      <EndChatModal
        open={endModalOpen}
        busy={ending}
        onConfirm={handleEndChat}
        onCancel={() => setEndModalOpen(false)}
      />
    </div>
  );
}
