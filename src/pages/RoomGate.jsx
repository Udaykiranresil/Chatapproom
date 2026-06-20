import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";
import TwinOrbit from "../components/TwinOrbit";
import CopyLinkField from "../components/CopyLinkField";
import ChatRoom from "./ChatRoom";
import { supabase } from "../lib/supabaseClient";
import { useAnonymousAuth } from "../hooks/useAnonymousAuth";

// gate states: "loading" | "not-found" | "full" | "waiting" | "active" | "ended" | "error"
export default function RoomGate() {
  const { code } = useParams();
  const { userId, status: authStatus, error: authError } = useAnonymousAuth();

  const [gate, setGate] = useState("loading");
  const [room, setRoom] = useState(null);
  const [participantIds, setParticipantIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const subscribedRef = useRef(false);

  // Step 1: resolve the room + join as a participant (or detect it's full / gone).
  useEffect(() => {
    if (authStatus !== "ready" || !userId || !code) return;
    let cancelled = false;

    async function resolveRoom() {
      const { data: roomRow, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code.toUpperCase())
        .maybeSingle();

      if (cancelled) return;

      if (roomError || !roomRow) {
        setGate("not-found");
        return;
      }
      setRoom(roomRow);

      const { data: participants, error: participantsError } = await supabase
        .from("room_participants")
        .select("user_id")
        .eq("room_id", roomRow.id);

      if (cancelled) return;
      if (participantsError) {
        setErrorMessage(participantsError.message);
        setGate("error");
        return;
      }

      const ids = participants.map((p) => p.user_id);
      const alreadyIn = ids.includes(userId);

      if (!alreadyIn && ids.length >= 2) {
        setGate("full");
        return;
      }

      if (!alreadyIn) {
        const { error: joinError } = await supabase
          .from("room_participants")
          .insert({ room_id: roomRow.id, user_id: userId });

        if (joinError) {
          if (cancelled) return;
          if (joinError.message?.includes("ROOM_FULL")) {
            setGate("full");
          } else {
            setErrorMessage(joinError.message);
            setGate("error");
          }
          return;
        }
        ids.push(userId);
      }

      if (cancelled) return;
      setParticipantIds(ids);
      setGate(ids.length >= 2 ? "active" : "waiting");
    }

    resolveRoom();
    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, code]);

  // Step 2: stay live -- watch participants join and watch for the room being ended.
  useEffect(() => {
    if (!room || subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel(`room-gate:${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_participants", filter: `room_id=eq.${room.id}` },
        (payload) => {
          setParticipantIds((curr) => {
            const next = curr.includes(payload.new.user_id) ? curr : [...curr, payload.new.user_id];
            if (next.length >= 2) setGate((g) => (g === "waiting" ? "active" : g));
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        () => {
          setGate("ended");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscribedRef.current = false;
    };
  }, [room]);

  const shareLink = room ? `${window.location.origin}/room/${room.code}` : "";

  if (gate === "loading") {
    return (
      <Shell>
        <TwinOrbit size={48} />
        <p className="text-mist text-sm mt-5">Opening room...</p>
      </Shell>
    );
  }

  if (gate === "not-found") {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold mb-3">This room doesn't exist</h1>
        <p className="text-mist text-sm mb-8 max-w-sm">
          The link might be mistyped, or the chat already ended and was deleted.
        </p>
        <HomeLink />
      </Shell>
    );
  }

  if (gate === "full") {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold mb-3">This room is already full</h1>
        <p className="text-mist text-sm mb-8 max-w-sm">
          Two people are already chatting here. Create your own room instead.
        </p>
        <Link
          to="/create"
          className="inline-flex bg-signal hover:bg-signal-dim text-white font-medium px-6 py-3 rounded-full transition-colors focus-ring"
        >
          Create a room
        </Link>
      </Shell>
    );
  }

  if (gate === "error") {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold mb-3">Something went wrong</h1>
        <p className="text-mist text-sm mb-8 max-w-sm">{errorMessage || authError?.message}</p>
        <HomeLink />
      </Shell>
    );
  }

  if (gate === "ended") {
    return (
      <Shell>
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 text-2xl">
          🕯️
        </div>
        <h1 className="font-display text-2xl font-semibold mb-3">This chat has ended</h1>
        <p className="text-mist text-sm mb-8 max-w-sm">
          The room was closed and every message was permanently deleted.
        </p>
        <HomeLink />
      </Shell>
    );
  }

  if (gate === "waiting") {
    return (
      <Shell>
        <TwinOrbit size={56} />
        <h1 className="font-display text-2xl font-semibold mt-6 mb-3">Waiting for the other person</h1>
        <p className="text-mist text-sm mb-7 max-w-sm">
          Send this link to the one person you want here. The room locks the
          moment they join.
        </p>
        <div className="w-full max-w-sm">
          <CopyLinkField link={shareLink} />
        </div>
      </Shell>
    );
  }

  // gate === "active"
  return <ChatRoom room={room} userId={userId} participantIds={participantIds} />;
}

function Shell({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 glass-panel rounded-3xl p-9 flex flex-col items-center max-w-md w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

function HomeLink() {
  return (
    <Link
      to="/"
      className="inline-flex bg-signal hover:bg-signal-dim text-white font-medium px-6 py-3 rounded-full transition-colors focus-ring"
    >
      Back to start
    </Link>
  );
}
