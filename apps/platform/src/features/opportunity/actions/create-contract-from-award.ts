"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  DefaultContractAwardApplicationService,
} from "@/features/contract/services";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  resolveOpportunityActionContext,
} from "./helpers";

type CreateContractFromAwardActionData = {
  contractId: string;
  contractNumber: string;
  created: boolean;
};

export async function createContractFromAwardAction(
  opportunityId: string,
): Promise<
  OpportunityActionResult<CreateContractFromAwardActionData>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultContractAwardApplicationService();

    const result =
      await service.createFromAward({
        workspaceId:
          context.workspaceId,
        actorUserId:
          context.actorUserId,
        opportunityId,
      });

    const opportunityPath =
      `/platform/opportunities/${opportunityId}`;

    revalidatePath("/platform/contracts");
    revalidatePath(
      `/platform/contracts/${result.contractId}`,
    );
    revalidatePath(opportunityPath);
    revalidatePath(`${opportunityPath}/offers`);
    revalidatePath(`${opportunityPath}/award`);

    return opportunityActionSuccess(
      result,
      result.created
        ? "تم إنشاء مسودة العقد من العرض الفائز."
        : "مسودة العقد موجودة مسبقًا، تم فتحها دون تكرار.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
