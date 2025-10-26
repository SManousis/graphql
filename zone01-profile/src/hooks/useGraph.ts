import { gql } from "../lib/api";
import { useEffect, useState } from "react";
import { ME, XP_TRANSACTIONS, OBJECT_BY_IDS as _OBJECT_BY_IDS, PROGRESS } from "../graphql/queries"; // ensure the import name matches your file
import { useAuth } from "../auth/useAuth";
import { messageFromError } from "../lib/errors";

export type User = { id: number; login: string; firstName?: string; lastName?: string; email?: string };
export type Tx = { id: number; amount: number; objectId: number; userId: number; createdAt: string; path: string };
export type Obj = { id: number; name: string; type: string };
export type ProgressEntry = {
  id: number;
  grade: number | string;
  createdAt: string;
  updatedAt?: string;
  path: string;
  objectId?: number | null;
  user?: { id: number; login: string };
  object?: { id: number; name: string; type: string };
};

// useMe retrieves the authenticated user profile so dashboards can show identity context.
// The hook handles loading and cancellation when auth token changes.
export function useMe() {
  const { token } = useAuth();
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true; // guards against setState after component unmounts
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

// useXpData fetches raw XP transactions plus their referenced objects so charts don't need to handle GraphQL.
export function useXpData() {
  const { token } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [objects, setObjects] = useState<Map<number, Obj>>(new Map());
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true; // shared flag prevents race conditions if token rotates mid-request
    (async () => {
      try {
        setLoading(true);
        const d = await gql<{ transaction: Tx[] }>(token, XP_TRANSACTIONS, { limit: 2000 });
        if (!mounted) return;
        setTxs(d.transaction);

        const ids = Array.from(new Set(d.transaction.map((t) => t.objectId))).filter((id) => typeof id === "number"); // map ensures we only fetch each object once
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


// usePassFailData computes aggregate pass/fail stats from the current user's results.
export function usePassFailData(userId?: number) {
  const { token } = useAuth();
  const [passCount, setPassCount] = useState<number>(0);
  const [failCount, setFailCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      setLoading(false);
      setPassCount(0);
      setFailCount(0);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const d = await gql<{ progress: ProgressEntry[] }>(token, PROGRESS, { limit: 2000, userId });
        if (!mounted) return;
        let pass = 0, fail = 0;
        d.progress.forEach((p) => {
          const grade = Number(p.grade);
          if (Number.isFinite(grade) && grade >= 1) pass++;
          else fail++;
        });
        setPassCount(pass);
        setFailCount(fail);
      } catch (e: unknown) {
        setError(messageFromError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token, userId]);

  const total = passCount + failCount;
  const passRate = total ? (passCount / total) : 0; // avoids NaN in empty state

  return { passCount, failCount, passRate, total, loading, error };
}

export type RecentProgress = ProgressEntry;

const progressKey = (objectId?: number | null, path?: string) =>
  `${objectId ?? "unknown"}::${path ?? "nopath"}`;

export function useRecentResults(limit = 5, userId?: number) {
  const { token } = useAuth();
  const [rows, setRows] = useState<RecentProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const fetchLimit = Math.max(limit * 4, limit + 10);
        const d = await gql<{ progress: ProgressEntry[] }>(token, PROGRESS, { limit: fetchLimit, userId });
        if (!mounted) return;
        const seen = new Set<string>();
        const unique: RecentProgress[] = [];
        for (const r of d.progress) {
          const key = progressKey(r.objectId, r.path);
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(r);
          if (unique.length >= limit) break;
        }
        setRows(unique);
      } catch (e: unknown) {
        setError(messageFromError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token, limit, userId]);

  return { rows, loading, error };
}
