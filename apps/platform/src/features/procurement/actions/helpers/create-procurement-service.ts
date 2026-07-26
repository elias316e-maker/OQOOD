import {
  prisma,
} from "@/lib/prisma";

import {
  PrismaProcurementAuthorizationGateway,
} from "../../authorization";

import {
  PrismaProcurementRequestItemRepository,
  PrismaProcurementRequestRepository,
} from "../../repositories";

import {
  DefaultProcurementApplicationService,
} from "../../services";

export function createProcurementService():
  DefaultProcurementApplicationService {
  return new DefaultProcurementApplicationService(
    new PrismaProcurementRequestRepository(),
    new PrismaProcurementRequestItemRepository(),
    new PrismaProcurementAuthorizationGateway(),
    prisma,
  );
}

