import {
  revalidatePath,
} from "next/cache";

const procurementPath =
  "/platform/procurement";

export function revalidateProcurementCollection():
  void {
  revalidatePath(procurementPath);
}

export function revalidateProcurementDetails(
  procurementRequestId: string,
): void {
  const normalizedId =
    procurementRequestId.trim();

  revalidatePath(procurementPath);

  if (normalizedId) {
    revalidatePath(
      `${procurementPath}/${normalizedId}`,
    );
  }
}

