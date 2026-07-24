import type {
  ProcurementItemType,
  ProcurementPriority,
  ProcurementRequestStatus,
} from "@/generated/prisma/client";

export type ProcurementItemInput = {
  id?: string;
  lineNumber: number;
  type: ProcurementItemType;
  description: string;
  quantity: string;
  unit: string;
  specification?: string | null;
  estimatedUnitPrice?: string | null;
  estimatedTotal?: string | null;
  requiredByDate?: string | null;
  deliveryLocation?: string | null;
  notes?: string | null;
};

export type CreateProcurementRequestInput = {
  workspaceId: string;
  actorUserId: string;
  projectId?: string | null;
  number: string;
  title: string;
  description?: string | null;
  priority?: ProcurementPriority;
  category?: string | null;
  requiredByDate?: string | null;
  currency?: string;
  requestedById: string;
  assignedToId?: string | null;
  items?: readonly ProcurementItemInput[];
};

export type UpdateProcurementRequestInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  projectId?: string | null;
  title?: string;
  description?: string | null;
  priority?: ProcurementPriority;
  category?: string | null;
  requiredByDate?: string | null;
  currency?: string;
  requestedById?: string;
  assignedToId?: string | null;
  items?: readonly ProcurementItemInput[];
};

export type ProcurementRequestCommandInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  reason?: string | null;
};

export type GetProcurementRequestInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
};

export type ListProcurementRequestsInput = {
  workspaceId: string;
  actorUserId: string;
  status?: ProcurementRequestStatus;
  priority?: ProcurementPriority;
  projectId?: string | null;
  requestedById?: string;
  assignedToId?: string | null;
  category?: string;
  search?: string;
  requiredByFrom?: string;
  requiredByTo?: string;
  page?: number;
  pageSize?: number;
};

export type ProcurementRequestItemResponse = {
  id: string;
  procurementRequestId: string;
  lineNumber: number;
  type: ProcurementItemType;
  description: string;
  quantity: string;
  unit: string;
  specification: string | null;
  estimatedUnitPrice: string | null;
  estimatedTotal: string | null;
  requiredByDate: string | null;
  deliveryLocation: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcurementRequestResponse = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  number: string;
  title: string;
  description: string | null;
  status: ProcurementRequestStatus;
  priority: ProcurementPriority;
  category: string | null;
  requiredByDate: string | null;
  currency: string;
  estimatedTotal: string | null;
  requestedById: string;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  items: ProcurementRequestItemResponse[];
};

export type ProcurementRequestSummaryResponse =
  Omit<
    ProcurementRequestResponse,
    "items" | "description"
  >;

export type ProcurementRequestListResponse = {
  items: ProcurementRequestSummaryResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
