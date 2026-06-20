import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Tracks live presence on a room's broadcast channel. Returns the set of
 * user_ids currently present, separate from the database's room_participants
 * table (which is the permanent record). Presence answers "who is here right
 * now" -- used for the online/offline dot and the disconnect banner.
 */
export function useRoomPresence(roomId, userId) {
  const [onlineIds, setOnlineIds] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase.channel(`presence:room:${roomId}`, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineIds(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return onlineIds;
}
