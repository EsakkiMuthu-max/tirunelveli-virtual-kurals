import { useQuery } from "@tanstack/react-query";
import { fetchSession, sessionQueryKey } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

/**
 * Who am I. `undefined` while the probe is in flight, `null` when nobody is signed in.
 * Never throws, so a page can render its shell before the answer arrives.
 */
export function useSession(): { user: SessionUser | null | undefined; isLoading: boolean } {
  const { data, isLoading, isError } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) return { user: undefined, isLoading: true };
  if (isError || !data) return { user: null, isLoading: false };
  return { user: data, isLoading: false };
}
