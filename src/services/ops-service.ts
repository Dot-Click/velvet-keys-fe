import { api, ApiError, uploadToStorage, type Page } from "@/lib/apiClient";
import type {
  CreateExpenseInput,
  CreateTicketInput,
  Expense,
  ExpenseListFilter,
  ExpenseSummary,
  FilePurpose,
  FileUrl,
  MaintenanceSummary,
  OwnerExpenseKpis,
  Ticket,
  TicketBoard,
  TicketDetail,
  TicketListFilter,
  UpdateExpenseInput,
  UpdateTicketInput,
  UploadUrl,
  UtilityRow,
  Worker,
  WorkerInput,
} from "@/types/ops";

function query(filter: object) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const ticketsService = {
  list(filter: TicketListFilter = {}): Promise<Page<Ticket>> {
    return api.get<Page<Ticket>>("/maintenance/tickets", { ...query(filter), view: "list" });
  },

  /** Kanban columns, each already grouped by status. */
  board(): Promise<TicketBoard> {
    return api.get<TicketBoard>("/maintenance/tickets", { view: "board" });
  },

  get(id: string): Promise<TicketDetail> {
    return api.get<TicketDetail>(`/maintenance/tickets/${id}`);
  },

  create(input: CreateTicketInput): Promise<Ticket> {
    return api.post<Ticket>("/maintenance/tickets", input);
  },

  update(id: string, patch: UpdateTicketInput): Promise<Ticket> {
    return api.patch<Ticket>(`/maintenance/tickets/${id}`, patch);
  },

  addPhotos(id: string, fileIds: string[]): Promise<TicketDetail> {
    return api.post<TicketDetail>(`/maintenance/tickets/${id}/photos`, { fileIds });
  },

  summary(): Promise<MaintenanceSummary> {
    return api.get<MaintenanceSummary>("/maintenance/summary");
  },
};

export const workersService = {
  list(page = 1, pageSize: 10 | 25 | 50 = 50, q?: string): Promise<Page<Worker>> {
    return api.get<Page<Worker>>("/workers", query({ page, pageSize, q }));
  },

  create(input: WorkerInput): Promise<Worker> {
    return api.post<Worker>("/workers", input);
  },

  update(id: string, patch: Partial<WorkerInput>): Promise<Worker> {
    return api.patch<Worker>(`/workers/${id}`, patch);
  },
};

export const expensesService = {
  list(filter: ExpenseListFilter = {}): Promise<Page<Expense>> {
    return api.get<Page<Expense>>("/expenses", query(filter));
  },

  create(input: CreateExpenseInput): Promise<Expense> {
    return api.post<Expense>("/expenses", input);
  },

  update(id: string, patch: UpdateExpenseInput): Promise<Expense> {
    return api.patch<Expense>(`/expenses/${id}`, patch);
  },

  markPaid(id: string): Promise<Expense> {
    return api.post<Expense>(`/expenses/${id}/mark-paid`, {});
  },

  remove(id: string): Promise<void> {
    return api.delete(`/expenses/${id}`);
  },

  summary(): Promise<ExpenseSummary> {
    return api.get<ExpenseSummary>("/expenses/summary");
  },

  utilities(): Promise<UtilityRow[]> {
    return api.get<UtilityRow[]>("/expenses/utilities");
  },

  ownerKpis(filter: { propertyId?: string; from?: string; to?: string } = {}): Promise<OwnerExpenseKpis> {
    return api.get<OwnerExpenseKpis>("/expenses/owner-kpis", query(filter));
  },
};

export const filesService = {
  /**
   * The full upload flow: ask the backend for a presigned URL, PUT the file straight to
   * storage from the browser, then confirm. Resolves with the new file's id, which the caller
   * then sends in the request that uses it (e.g. imageFileId, receiptFileId, photoFileIds).
   */
  async upload(file: File, purpose: FilePurpose): Promise<string> {
    const { fileId, uploadUrl } = await api.post<UploadUrl>("/files/upload-url", {
      purpose,
      mime: file.type,
      sizeBytes: file.size,
    });
    try {
      await uploadToStorage(uploadUrl, file, file.type);
    } catch {
      // This PUT goes straight to object storage, not through `api`/`apiClient`, so its
      // failures never pass through the response interceptor that turns a backend error into
      // an `ApiError` -- they were bubbling up as bare AxiosErrors and getting mistaken for a
      // generic "fetching your data" failure everywhere a caller checked `isApiError`/`code`
      // (e.g. maintenanceErrorKey), hiding that a photo upload is what actually failed.
      throw new ApiError(0, {
        code: "UPLOAD_FAILED",
        message: "Could not upload the file to storage.",
      });
    }
    await api.post(`/files/${fileId}/complete`);
    return fileId;
  },

  /** A short-lived download URL for display; re-request when it expires. */
  url(fileId: string): Promise<FileUrl> {
    return api.get<FileUrl>(`/files/${fileId}/url`);
  },
};
