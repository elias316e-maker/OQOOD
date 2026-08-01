import {
  revalidatePath,
} from "next/cache";

const opportunitiesPath =
  "/platform/opportunities";

export function revalidateOpportunityCollection():
  void {
  revalidatePath(opportunitiesPath);
}

export function revalidateOpportunityDetails(
  opportunityId: string,
): void {
  const normalizedOpportunityId =
    opportunityId.trim();

  revalidatePath(opportunitiesPath);

  if (normalizedOpportunityId) {
    revalidatePath(
      `${opportunitiesPath}/${normalizedOpportunityId}`,
    );
  }
}

export function revalidateOpportunityCriteria(
  opportunityId: string,
): void {
  const normalizedOpportunityId =
    opportunityId.trim();

  if (!normalizedOpportunityId) {
    return;
  }

  const opportunityPath =
    `${opportunitiesPath}/${normalizedOpportunityId}`;

  revalidatePath(opportunitiesPath);
  revalidatePath(opportunityPath);
  revalidatePath(`${opportunityPath}/criteria`);
  revalidatePath(`${opportunityPath}/evaluation`);
}
