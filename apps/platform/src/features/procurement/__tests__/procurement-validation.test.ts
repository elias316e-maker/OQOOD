import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createProcurementRequestSchema,
  listProcurementRequestsSchema,
  procurementRequestReasonCommandSchema,
  updateProcurementRequestSchema,
} from "../validators";

const context = {
  workspaceId: " workspace-1 ",
  actorUserId: " user-1 ",
};

describe("Procurement validation", () => {
  it("normalizes a valid create request", () => {
    const result =
      createProcurementRequestSchema.safeParse({
        ...context,
        number: " pr-2026-001 ",
        title: "  توريد مواد إنشاء  ",
        description: " ",
        priority: "HIGH",
        category: "",
        currency: "sar",
        requestedById: " requester-1 ",
        items: [
          {
            lineNumber: "1",
            type: "MATERIAL",
            description: "  أسمنت مقاوم  ",
            quantity: "25.5",
            unit: " كيس ",
            estimatedUnitPrice: 18,
            requiredByDate: "2026-08-01",
          },
        ],
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data).toMatchObject({
      workspaceId: "workspace-1",
      actorUserId: "user-1",
      number: "PR-2026-001",
      title: "توريد مواد إنشاء",
      description: null,
      priority: "HIGH",
      category: null,
      currency: "SAR",
      requestedById: "requester-1",
    });
    expect(
      result.data.items?.[0],
    ).toMatchObject({
      lineNumber: 1,
      description: "أسمنت مقاوم",
      quantity: "25.5",
      unit: "كيس",
      estimatedUnitPrice: "18",
    });
    expect(
      result.data.items?.[0]?.requiredByDate,
    ).toContain("2026-08-01");
  });

  it("rejects duplicate line numbers", () => {
    const item = {
      lineNumber: 1,
      type: "SERVICE",
      description: "خدمة اختبار",
      quantity: "1",
      unit: "خدمة",
    };
    const result =
      createProcurementRequestSchema.safeParse({
        ...context,
        number: "PR-1",
        title: "طلب اختبار",
        requestedById: "requester-1",
        items: [item, item],
      });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.path.join(".") === "items",
      ),
    ).toBe(true);
  });

  it("rejects invalid quantities and prices", () => {
    const result =
      createProcurementRequestSchema.safeParse({
        ...context,
        number: "PR-2",
        title: "طلب اختبار",
        requestedById: "requester-1",
        items: [
          {
            lineNumber: 1,
            type: "WORK",
            description: "أعمال اختبار",
            quantity: "0",
            unit: "متر",
            estimatedUnitPrice: "-1",
          },
        ],
      });

    expect(result.success).toBe(false);
  });

  it("accepts partial update input", () => {
    const result =
      updateProcurementRequestSchema.safeParse({
        ...context,
        procurementRequestId: "request-1",
        title: " عنوان محدث ",
        assignedToId: null,
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.title).toBe(
      "عنوان محدث",
    );
    expect(result.data.assignedToId).toBeNull();
  });

  it("requires a reason for rejection or changes", () => {
    const result =
      procurementRequestReasonCommandSchema.safeParse(
        {
          ...context,
          procurementRequestId: "request-1",
          reason: " ",
        },
      );

    expect(result.success).toBe(false);
  });

  it("normalizes list filters and pagination", () => {
    const result =
      listProcurementRequestsSchema.safeParse({
        ...context,
        status: "SUBMITTED",
        priority: "URGENT",
        search: "  إسمنت  ",
        category: "  مواد  ",
        requiredByFrom: "2026-08-01",
        requiredByTo: "2026-08-31",
        page: "2",
        pageSize: "25",
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data).toMatchObject({
      status: "SUBMITTED",
      priority: "URGENT",
      search: "إسمنت",
      category: "مواد",
      page: 2,
      pageSize: 25,
    });
  });

  it("rejects reversed date ranges", () => {
    const result =
      listProcurementRequestsSchema.safeParse({
        ...context,
        requiredByFrom: "2026-09-01",
        requiredByTo: "2026-08-01",
      });

    expect(result.success).toBe(false);
  });

  it("limits list page size to one hundred", () => {
    const result =
      listProcurementRequestsSchema.safeParse({
        ...context,
        pageSize: 101,
      });

    expect(result.success).toBe(false);
  });
});

