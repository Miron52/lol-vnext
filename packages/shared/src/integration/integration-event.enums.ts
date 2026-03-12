/** Processing status of an inbound integration event. */
export enum IntegrationEventStatus {
  /** Persisted but not yet processed. */
  Pending = 'pending',
  /** Successfully mapped into a Load create/update. */
  Processed = 'processed',
  /** Duplicate event — identical payload hash or external_event_id already seen. */
  Duplicate = 'duplicate',
  /** Processing failed — bad payload, missing required fields, etc. */
  Failed = 'failed',
}

/** Outcome of event processing — what happened to the target Load. */
export enum IntegrationEventResult {
  /** A new Load was created. */
  Created = 'created',
  /** An existing Load was updated. */
  Updated = 'updated',
  /** No change — event was a duplicate. */
  Skipped = 'skipped',
  /** Processing failed. */
  Failed = 'failed',
}
