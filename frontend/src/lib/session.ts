import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { SessionUser } from "@/lib/types";

export const sessionQueryKey = ["auth", "me"] as const;

export const fetchSession = () => apiGet<SessionUser>("/auth/me");

/** Call after a successful login so every cached query refetches under the new identity. */
export async function beginSession(user: SessionUser): Promise<void> {
  queryClient.setQueryData(sessionQueryKey, user);
  await queryClient.invalidateQueries();
}

/**
 * The only sanctioned sign-out path. Clearing the server session without dropping the
 * react-query cache would render the previous account's data for the next login.
 */
export async function endSession(): Promise<void> {
  try {
    await apiPost<void>("/auth/logout");
  } finally {
    queryClient.clear();
  }
}
