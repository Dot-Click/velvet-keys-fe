import { api } from "@/lib/apiClient";
import type {
  AccountChannexStatus,
  Channel,
  ChannelConnection,
  ConnectChannelResult,
  SyncStatus,
} from "@/types/channex";

export const channexService = {
  /** Starts a connection; send the user to the returned `channexAuthUrl` to authorize it. */
  connect(unitId: string, channel: Channel): Promise<ConnectChannelResult> {
    return api.post<ConnectChannelResult>(`/channex/units/${unitId}/connect`, { channel });
  },

  listConnections(unitId: string): Promise<ChannelConnection[]> {
    return api.get<ChannelConnection[]>(`/channex/units/${unitId}/connections`);
  },

  disconnect(connectionId: string): Promise<ChannelConnection> {
    return api.post<ChannelConnection>(`/channex/connections/${connectionId}/disconnect`);
  },

  syncStatus(connectionId: string): Promise<SyncStatus> {
    return api.get<SyncStatus>(`/channex/connections/${connectionId}/sync-status`);
  },

  accountStatus(): Promise<AccountChannexStatus> {
    return api.get<AccountChannexStatus>("/channex/account-status");
  },
};
