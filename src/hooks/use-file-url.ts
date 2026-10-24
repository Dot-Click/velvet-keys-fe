import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { filesService } from "@/services/ops-service";

/**
 * A short-lived download URL for an uploaded file (cover images, receipts, ticket photos).
 * Idle while there is no file id. The URL expires, so it is cached for less than that and
 * fetched again afterwards.
 */
export function useFileUrl(fileId: string | null | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["file-url", session?.profile.id ?? "", session?.profile.accountId ?? "", fileId],
    queryFn: () => filesService.url(fileId ?? ""),
    enabled: Boolean(fileId),
    staleTime: 4 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (file) => file.url,
  });
}
