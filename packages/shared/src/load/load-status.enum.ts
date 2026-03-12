/**
 * Load lifecycle statuses.
 * Values from PRD section 5.1 (Status field).
 */
export enum LoadStatus {
  NotPickedUp = 'not_picked_up',
  InTransit = 'in_transit',
  Delivered = 'delivered',
  Completed = 'completed',
  Cancelled = 'cancelled',
}
