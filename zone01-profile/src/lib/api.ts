const BASE = import.meta.env.VITE_PROXY_BASE ?? "http://localhost:8080";

export type LoginResp = { token: string };

type GraphQLErrorItem = { message: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLErrorItem[] };

export async function signin(identity: string, password: string): Promise<LoginResp> {
  const r = await fetch(`${BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity, password }),
  });
  if (!r.ok) throw new Error("Invalid credentials");
  return (await r.json()) as LoginResp;
}

export async function gql<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const r = await fetch(`${BASE}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await r.json()) as GraphQLResponse<T>;

  if (!r.ok || (json.errors && json.errors.length > 0)) {
    const msg = json.errors?.[0]?.message ?? `HTTP ${r.status}`;
    throw new Error(msg);
  }
  if (!json.data) {
    throw new Error("No data in GraphQL response");
  }
  return json.data;
}
