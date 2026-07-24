import {
  describe,
  expect,
  it,
} from "vitest";

import {
  archiveOpportunitySchema,
  createOpportunitySchema,
  listWorkspaceOpportunitiesSchema,
  publishOpportunitySchema,
  updateOpportunitySchema,
} from "../validators";

describe(
  "Opportunity Validation",
  () => {
    it(
      "normalizes valid create input",
      () => {
        const result =
          createOpportunitySchema.safeParse({
            workspaceId: " workspace-1 ",
            actorUserId: " user-1 ",
            number: " rfq-2026-001 ",
            title: "  توريد مواد إنشائية  ",
            description: "   ",
            type: "RFQ",
            category: "",
            priority: " high ",
            budget: "250000",
            currency: "sar",
            issueDate: "2026-08-01T00:00:00.000Z",
            closingDate:
              "2026-08-15T00:00:00.000Z",
          });

        expect(result.success).toBe(true);

        if (!result.success) {
          return;
        }

        expect(result.data).toMatchObject({
          workspaceId: "workspace-1",
          actorUserId: "user-1",
          number: "RFQ-2026-001",
          title: "توريد مواد إنشائية",
          description: null,
          type: "RFQ",
          visibility: "INVITED",
          category: null,
          priority: "HIGH",
          budget: "250000.00",
          currency: "SAR",
        });

        expect(result.data.issueDate).toBeInstanceOf(Date);
        expect(result.data.closingDate).toBeInstanceOf(Date);
      },
    );

    it(
      "rejects a closing date before the issue date",
      () => {
        const result =
          createOpportunitySchema.safeParse({
            workspaceId: "workspace-1",
            actorUserId: "user-1",
            number: "RFQ-001",
            title: "فرصة اختبار صحيحة",
            type: "RFQ",
            issueDate:
              "2026-08-15T00:00:00.000Z",
            closingDate:
              "2026-08-01T00:00:00.000Z",
          });

        expect(result.success).toBe(false);

        if (result.success) {
          return;
        }

        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join(".") === "closingDate",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects invalid create values",
      () => {
        const result =
          createOpportunitySchema.safeParse({
            workspaceId: "",
            actorUserId: "",
            number: "A",
            title: "AB",
            type: "UNKNOWN",
            budget: "-1",
            currency: "SA",
          });

        expect(result.success).toBe(false);
      },
    );

    it(
      "accepts an update request without mutable fields (business rule enforced by Application Service)",
      () => {
        const result =
          updateOpportunitySchema.safeParse({
            workspaceId: "workspace-1",
            actorUserId: "user-1",
            opportunityId: "opportunity-1",
          });

        if (!result.success) {
          console.log(result.error.flatten());
        }

        expect(result.success).toBe(true);

        if (!result.success) {
          return;
        }

        expect(result.data).toMatchObject({
          workspaceId: "workspace-1",
          actorUserId: "user-1",
          opportunityId: "opportunity-1",
        });
      },
    );

    it(
      "accepts and normalizes update input",
      () => {
        const result =
          updateOpportunitySchema.safeParse({
            workspaceId: "workspace-1",
            actorUserId: "user-1",
            opportunityId: "opportunity-1",
            title: "  عنوان محدث  ",
            description: "",
            budget: 1000,
            currency: "usd",
          });

        if (!result.success) {
          console.log(result.error.flatten());
        }

        expect(result.success).toBe(true);

        if (!result.success) {
          return;
        }

        expect(result.data.title).toBe(
          "عنوان محدث",
        );

        expect(result.data.description).toBeNull();
        expect(result.data.budget).toBe("1000.00");
        expect(result.data.currency).toBe("USD");
      },
    );

    it(
      "validates publish and archive contexts",
      () => {
        expect(
          publishOpportunitySchema.safeParse({
            workspaceId: "workspace-1",
            actorUserId: "user-1",
            opportunityId: "opportunity-1",
          }).success,
        ).toBe(true);

        expect(
          archiveOpportunitySchema.safeParse({
            workspaceId: "workspace-1",
            actorUserId: "user-1",
            opportunityId: "opportunity-1",
          }).success,
        ).toBe(true);
      },
    );

    it(
      "normalizes list pagination and filters",
      () => {
        const result =
          listWorkspaceOpportunitiesSchema.safeParse({
            workspaceId: "workspace-1",
            actorUserId: "user-1",
            status: "DRAFT",
            type: "RFQ",
            visibility: "PRIVATE",
            search: "  مواد  ",
            page: "2",
            pageSize: "25",
          });

        if (!result.success) {
          console.log(result.error.flatten());
        }

        expect(result.success).toBe(true);

        if (!result.success) {
          return;
        }

        expect(result.data).toEqual({
          workspaceId: "workspace-1",
          actorUserId: "user-1",
          status: "DRAFT",
          type: "RFQ",
          visibility: "PRIVATE",
          search: "مواد",
          page: 2,
          pageSize: 25,
        });
      },
    );

    it(
      "limits page size to one hundred",
      () => {
        const result =
          listWorkspaceOpportunitiesSchema.safeParse({
            workspaceId: "workspace-1",
            pageSize: 101,
          });

        expect(result.success).toBe(false);
      },
    );
  },
);
