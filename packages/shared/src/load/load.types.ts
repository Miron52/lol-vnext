import { LoadStatus } from './load-status.enum';

/** Full Load DTO returned by the API. */
export interface LoadDto {
  id: string;
  sylNumber: string;

  /** External system that created this load (e.g. "cargo_etl", "manual"). */
  externalSource: string | null;
  /** Key in the external system, used for dedup. */
  externalLoadKey: string | null;

  weekId: string;
  date: string;

  // Staged FKs — uuid strings until Unit/Driver/Brokerage entities exist.
  unitId: string | null;
  driverId: string | null;
  dispatcherId: string;
  businessName: string;
  brokerageId: string | null;

  netsuiteRef: string | null;

  fromAddress: string;
  fromState: string;
  fromDate: string;
  toAddress: string;
  toState: string;
  toDate: string;
  miles: number;

  grossAmount: number;
  driverCostAmount: number;
  /** Derived: grossAmount - driverCostAmount */
  profitAmount: number;
  /** Derived: (profitAmount / grossAmount) * 100. 0 when grossAmount is 0. */
  profitPercent: number;
  /** Derived: grossAmount × 0.0125 */
  otrAmount: number;
  /** Derived: profitAmount − otrAmount */
  netProfitAmount: number;

  quickPayFlag: boolean;
  directPaymentFlag: boolean;
  factoringFlag: boolean;
  driverPaidFlag: boolean;

  loadStatus: LoadStatus;
  comment: string | null;

  /** Audit trail: "manual" | "webhook". */
  auditSource: string;

  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/** Fields required to create a load. Derived fields are computed server-side. */
export interface CreateLoadRequest {
  sylNumber: string;
  externalSource?: string | null;
  externalLoadKey?: string | null;

  weekId: string;
  date: string;

  unitId?: string | null;
  driverId?: string | null;
  dispatcherId: string;
  businessName: string;
  brokerageId?: string | null;

  netsuiteRef?: string | null;

  fromAddress: string;
  fromState: string;
  fromDate: string;
  toAddress: string;
  toState: string;
  toDate: string;
  miles: number;

  grossAmount: number;
  driverCostAmount: number;

  quickPayFlag?: boolean;
  directPaymentFlag?: boolean;
  factoringFlag?: boolean;
  driverPaidFlag?: boolean;

  loadStatus?: LoadStatus;
  comment?: string | null;
}

/** Partial update. Only supplied fields are changed. */
export type UpdateLoadRequest = Partial<CreateLoadRequest>;
