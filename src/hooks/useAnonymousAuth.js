import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Ensures the visitor has a Supabase anonymous auth session before they
 * can create or join a room. This gives every participant a stable,
 * unguessable user_id (auth.uid()) that the database's row-level security
 * policies use to enforce "only 2 people, only participants can read/write".
 *
 * Requires Anonymous Sign-Ins to be enabled in Supabase: Authentication -> Providers.
 */
export function useAnonymousAuth() {
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function ensureSession() {
      try {
        const { data: existing } = await supabase.auth.getSession();
        let session = existing?.session;

        if (!session) {
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
          session = data.session;
        }

        if (mounted) {
          setUserId(session.user.id);
          setStatus("ready");
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setStatus("error");
        }
      }
    }

    ensureSession();
    return () => {
      mounted = false;
    };
  }, []);

  return { userId, status, error };
}