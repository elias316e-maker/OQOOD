import type {
  ProcurementRequestItemRecord,
  ProcurementRequestItemResponse,
  ProcurementRequestRecord,
  ProcurementRequestResponse,
  ProcurementRequestSummaryResponse,
} from "../dtos";

export function mapProcurementRequestItemResponse(
  item: ProcurementRequestItemRecord,
): ProcurementRequestItemResponse {
  return {
    id: item.id,
    procurementRequestId:
      item.procurementRequestId,
    lineNumber: item.lineNumber,
    type: item.type,
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit,
    specification: item.specification,
    estimatedUnitPrice:
      item.estimatedUnitPrice?.toString() ??
      null,
    estimatedTotal:
      item.estimatedTotal?.toString() ??
      null,
    requiredByDate:
      item.requiredByDate?.toISOString() ??
      null,
    deliveryLocation:
      item.deliveryLocation,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function mapProcurementRequestResponse(
  request: ProcurementRequestRecord,
  items: readonly ProcurementRequestItemRecord[],
): ProcurementRequestResponse {
  return {
    id: request.id,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    number: request.number,
    title: request.title,
    description: request.description,
    status: request.status,
    priority: request.priority,
    category: request.category,
    requiredByDate:
      request.requiredByDate?.toISOString() ??
      null,
    currency: request.currency,
    estimatedTotal:
      request.estimatedTotal?.toString() ??
      null,
    requestedById: request.requestedById,
    assignedToId: request.assignedToId,
    createdById: request.createdById,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    items: items.map(
      mapProcurementRequestItemResponse,
    ),
  };
}

export function mapProcurementRequestSummaryResponse(
  request: ProcurementRequestRecord,
): ProcurementRequestSummaryResponse {
  const {
    description: _description,
    items: _items,
    ...summary
  } = mapProcurementRequestResponse(
    request,
    [],
  );

  void _description;
  void _items;

  return summary;
}
