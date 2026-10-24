import { useFileUrl } from "@/hooks/use-file-url";

/**
 * A short-lived download URL for a lease's contract PDF, resolved from its stored file id.
 * `url` is null while there is no contract on file, or while the signed URL is loading.
 */
export function useContractFile(contractFileId: string | null | undefined) {
  const fileUrl = useFileUrl(contractFileId);
  return {
    url: fileUrl.data ?? null,
    isLoading: fileUrl.isLoading,
    fileName: "contract.pdf",
  };
}
