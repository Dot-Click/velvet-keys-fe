/** Channel connections through Channex (velvet-keys-be/app/schemas/channex.py). */

export type Channel = "airbnb" | "booking";
export type ChannelConnectionStatus = "pending" | "connected" | "error" | "disconnected";

export interface ConnectChannelResult {
  connectionId: string;
  /** The Channex-hosted authorization page: send the user there to link their listing. */
  channexAuthUrl: string;
}

export interface ChannelConnection {
  id: string;
  channel: Channel;
  status: ChannelConnectionStatus;
  listingName: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  pendingSince: string | null;
}

export interface SyncStatus extends ChannelConnection {
  /** True when the status came from the cache rather than a fresh Channex call. */
  cached: boolean;
}

export interface AccountChannexStatus {
  groupConnected: boolean;
  totalConnectedUnits: number;
  syncIssueCount: number;
}
