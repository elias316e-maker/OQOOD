import type {
  ProcurementItemType,
  ProcurementPriority,
  ProcurementRequestStatus,
  Prisma,
} from "@/generated/prisma/client";

export type ProcurementRequestRecord = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  number: string;
  title: string;
  description: string | null;
  status: ProcurementRequestStatus;
  priority: ProcurementPriority;
  category: string | null;
  requiredByDate: Date | null;
  currency: string;
  estimatedTotal: Prisma.Decimal | null;
  requestedById: string;
  assignedToId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProcurementRequestItemRecord = {
  id: string;
  procurementRequestId: string;
  lineNumber: number;
  type: ProcurementItemType;
  description: string;
  quantity: Prisma.Decimal;
  unit: string;
  specification: string | null;
  estimatedUnitPrice: Prisma.Decimal | null;
  estimatedTotal: Prisma.Decimal | null;
  requiredByDate: Date | null;
  deliveryLocation: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProcurementRequestListFilters = {
  status?: ProcurementRequestStatus;
  priority?: ProcurementPriority;
  projectId?: string | null;
  requestedById?: string;
  assignedToId?: string | null;
  category?: string;
  search?: string;
  requiredByFrom?: Date;
  requiredByTo?: Date;
};

export type ProcurementRequestListInput = {
  workspaceId: string;
  filters?: ProcurementRequestListFilters;
  limit?: number;
  offset?: number;
};

export type ProcurementRequestListResult = {
  items: ProcurementRequestRecord[];
  total: number;
};

export type CreateProcurementRequestRecordInput = {
  workspaceId: string;
  projectId?: string | null;
  number: string;
  title: string;
  description?: string | null;
  status?: ProcurementRequestStatus;
  priority?: ProcurementPriority;
  category?: string | null;
  requiredByDate?: Date | null;
  currency?: string;
  estimatedTotal?: Prisma.Decimal | null;
  requestedById: string;
  assignedToId?: string | null;
  createdById: string;
};

export type UpdateProcurementRequestRecordInput = {
  projectId?: string | null;
  title?: string;
  description?: string | null;
  status?: ProcurementRequestStatus;
  priority?: ProcurementPriority;
  category?: string | null;
  requiredByDate?: Date | null;
  currency?: string;
  estimatedTotal?: Prisma.Decimal | null;
  requestedById?: string;
  assignedToId?: string | null;
};

export type CreateProcurementRequestItemRecordInput = {
  procurementRequestId: string;
  lineNumber: number;
  type: ProcurementItemType;
  description: string;
  quantity: Prisma.Decimal;
  unit: string;
  specification?: string | null;
  estimatedUnitPrice?: Prisma.Decimal | null;
  estimatedTotal?: Prisma.Decimal | null;
  requiredByDate?: Date | null;
  deliveryLocation?: string | null;
  notes?: string | null;
};

export type UpdateProcurementRequestItemRecordInput = {
  lineNumber?: number;
  type?: ProcurementItemType;
  description?: string;
  quantity?: Prisma.Decimal;
  unit?: string;
  specification?: string | null;
  estimatedUnitPrice?: Prisma.Decimal | null;
  estimatedTotal?: Prisma.Decimal | null;
  requiredByDate?: Date | null;
  deliveryLocation?: string | null;
  notes?: string | null;
};
