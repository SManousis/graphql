import { gql } from "../lib/api";
import { useEffect, useState } from "react";
import { ME, XP_TRANSACTIONS, OBJECT_BY_IDS as _OBJECT_BY_IDS } from "../graphql/queries"; // ensure the import name matches your file
import { useAuth } from "../auth/useAuth";
import { messageFromError } from "../lib/errors";

export type User = { id: number; login: string; firstName?: string; lastName?: string; email?: string };
export type Tx = { id: number; amount: number; objectId: number; userId: number; createdAt: string; path: string };
export type Obj = { id: number; name: string; type: string };

export function useMe() {
  const { token } = useAuth();
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const d = await gql<{ user: User[] }>(token, ME);
        if (!mounted) return;
        setData(d.user?.[0] ?? null);
      } catch (e: unknown) {
        setError(messageFromError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  return { data, loading, error };
}

export function useXpData() {
  const { token } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [objects, setObjects] = useState<Map<number, Obj>>(new Map());
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const d = await gql<{ transaction: Tx[] }>(token, XP_TRANSACTIONS, { limit: 2000 });
        if (!mounted) return;
        setTxs(d.transaction);

        const ids = Array.from(new Set(d.transaction.map((t) => t.objectId))).filter((id) => typeof id === "number");
        if (ids.length) {
          const o = await gql<{ object: Obj[] }>(token, _OBJECT_BY_IDS, { ids });
          const m = new Map<number, Obj>();
          o.object.forEach((it) => m.set(it.id, it));
          if (!mounted) return;
          setObjects(m);
        }
      } catch (e: unknown) {
        setError(messageFromError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  return { txs, objects, loading, error };
}
