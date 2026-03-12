import { IntegrationEventStatus, IntegrationEventResult } from './integration-event.enums';

/** Full IntegrationEvent DTO returned by the API. */
export interface IntegrationEventDto {
  id: string;
  sourceSystem: string;
  externalEventId: string | null;
  eventType: string;
  payloadHash: string;
  /** Raw JSON payload — opaque to consumers. */
  payloadJson: Record<string, unknown>;
  processingStatus: IntegrationEventStatus;
  processingResult: IntegrationEventResult | null;
  /** Error message when status = failed. */
  processingError: string | null;
  /** Load ID if a load was created or updated. */
  loadId: string | null;
  receivedAt: string;
  processedAt: string | null;
}

/**
 * Minimal normalized contract for the Cargo webhook payload.
 *
 * ASSUMPTION: This is a best-effort mapping based on the canonical Load schema.
 * The actual Cargo system payload structure is unknown — this contract represents
 * the minimum fields we expect. Real integration will likely require adjustments
 * once the actual Cargo API documentation is available.
 *
 * Fields marked optional may or may not be present in the real payload.
 */
export interface CargoWebhookPayload {
  /** Cargo's own event identifier for dedup. */
  eventId?: string;
  /** Event type hint: "load.created", "load.updated", etc. */
  eventType?: string;

  /** Load key in Cargo's system. Used for external dedup. */
  loadKey: string;

  /** SYL number — primary business identifier. */
  sylNumber: string;

  /** ISO date string for the load date. */
  date: string;

  /** Dispatcher email — resolved to userId server-side. */
  dispatcherEmail: string;

  /** Business / company name on the load. */
  businessName: string;

  // ── Route ──────────────────────────────────────────────────
  fromAddress: string;
  fromState: string;
  fromDate: string;
  toAddress: string;
  toState: string;
  toDate: string;
  miles?: number;

  // ── Financials ─────────────────────────────────────────────
  grossAmount: number;
  driverCostAmount: number;

  // ── Optional fields ────────────────────────────────────────
  unitId?: string;
  driverId?: string;
  brokerageId?: string;
  netsuiteRef?: string;
  loadStatus?: string;
  comment?: string;
  quickPayFlag?: boolean;
  directPaymentFlag?: boolean;
  factoringFlag?: boolean;
  driverPaidFlag?: boolean;
}
