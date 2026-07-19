import { WorkspaceOnboardingWizard } from "@/features/workspace";
import { requireWorkspaceOnboarding } from "@/features/workspace/guards";

export default async function WorkspaceOnboardingPage() {
  const user = await requireWorkspaceOnboarding();

  return (
    <WorkspaceOnboardingWizard
      userName={user.name}
    />
  );
}
