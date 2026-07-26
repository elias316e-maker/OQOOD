import {
  getOpportunityOffersAction,
} from "@/features/opportunity/actions";
import {
  OpportunityOffersForm,
} from "@/features/opportunity/components";
import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";
import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type Props = {
  params: Promise<{ opportunityId: string }>;
};

export default async function OpportunityOffersPage({
  params,
}: Props) {
  const { opportunityId } = await params;
  const [result, context] = await Promise.all([
    getOpportunityOffersAction(opportunityId),
    requireCurrentWorkspace(),
  ]);

  if (!result.success) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel">
          <div className="emptyState" role="alert">
            <h1>تعذر تحميل عروض الموردين</h1>
            <p>{result.message}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <OpportunityOffersForm
      canEvaluate={hasPermission(
        context,
        Permissions.opportunities.evaluate,
      )}
      canAward={hasPermission(
        context,
        Permissions.opportunities.award,
      )}
      canCreateContract={hasPermission(
        context,
        Permissions.contracts.create,
      )}
      data={result.data}
    />
  );
}
