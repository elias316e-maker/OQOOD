import type {
  PrismaClient,
} from "../../../src/generated/prisma/client";

import {
  Permissions,
  type PermissionCode,
} from "../../../src/lib/permissions";

type PermissionCatalogEntry = {
  code: PermissionCode;
  name: string;
  description: string;
};

export const PERMISSION_CATALOG = [
  {
    code: Permissions.workspace.read,
    name: "عرض مساحة العمل",
    description: "عرض بيانات وإعدادات مساحة العمل.",
  },
  {
    code: Permissions.workspace.update,
    name: "تعديل مساحة العمل",
    description: "تعديل البيانات والإعدادات العامة لمساحة العمل.",
  },
  {
    code: Permissions.workspace.manageMembers,
    name: "إدارة أعضاء مساحة العمل",
    description: "دعوة الأعضاء وتحديث حالاتهم وإزالتهم.",
  },
  {
    code: Permissions.workspace.manageRoles,
    name: "إدارة الأدوار والصلاحيات",
    description: "إنشاء الأدوار وتعديلها وربط الصلاحيات بها.",
  },
  {
    code: Permissions.workspace.manageBilling,
    name: "إدارة الفوترة",
    description: "إدارة الاشتراك والفواتير وبيانات الحساب التجاري.",
  },

  {
    code: Permissions.opportunities.create,
    name: "إنشاء الفرص",
    description: "إنشاء فرص جديدة داخل مساحة العمل.",
  },
  {
    code: Permissions.opportunities.read,
    name: "عرض الفرص",
    description: "عرض الفرص وتفاصيلها.",
  },
  {
    code: Permissions.opportunities.update,
    name: "تعديل الفرص",
    description: "تعديل بيانات الفرص الحالية.",
  },
  {
    code: Permissions.opportunities.delete,
    name: "حذف الفرص",
    description: "حذف الفرص وفق السياسات المعتمدة.",
  },
  {
    code: Permissions.opportunities.publish,
    name: "نشر الفرص",
    description: "نشر الفرص وإتاحتها للمشاركين.",
  },
  {
    code: Permissions.opportunities.evaluate,
    name: "تقييم عروض الفرص",
    description: "تنفيذ تقييم العروض المرتبطة بالفرص.",
  },
  {
    code: Permissions.opportunities.award,
    name: "ترسية الفرص",
    description: "اعتماد قرار الترسية النهائي للفرص.",
  },

  {
    code: Permissions.contracts.create,
    name: "إنشاء العقود",
    description: "إنشاء مسودات وعقود جديدة.",
  },
  {
    code: Permissions.contracts.read,
    name: "عرض العقود",
    description: "عرض العقود وتفاصيلها.",
  },
  {
    code: Permissions.contracts.update,
    name: "تعديل العقود",
    description: "تعديل بيانات ومسودات العقود.",
  },
  {
    code: Permissions.contracts.delete,
    name: "حذف العقود",
    description: "حذف العقود وفق القيود المعتمدة.",
  },
  {
    code: Permissions.contracts.approve,
    name: "اعتماد العقود",
    description: "اعتماد العقود قبل الإصدار أو التوقيع.",
  },
  {
    code: Permissions.contracts.sign,
    name: "توقيع العقود",
    description: "تنفيذ أو اعتماد توقيع العقود.",
  },

  {
    code: Permissions.procurement.create,
    name: "إنشاء طلبات المشتريات",
    description: "إنشاء عمليات وطلبات مشتريات جديدة.",
  },
  {
    code: Permissions.procurement.read,
    name: "عرض المشتريات",
    description: "عرض طلبات وعمليات المشتريات.",
  },
  {
    code: Permissions.procurement.update,
    name: "تعديل المشتريات",
    description: "تعديل طلبات وعمليات المشتريات.",
  },
  {
    code: Permissions.procurement.delete,
    name: "حذف المشتريات",
    description: "حذف طلبات المشتريات وفق السياسات.",
  },
  {
    code: Permissions.procurement.approve,
    name: "اعتماد المشتريات",
    description: "اعتماد طلبات وقرارات المشتريات.",
  },

  {
    code: Permissions.vendors.create,
    name: "إضافة الموردين",
    description: "إنشاء سجلات موردين جدد.",
  },
  {
    code: Permissions.vendors.read,
    name: "عرض الموردين",
    description: "عرض بيانات الموردين.",
  },
  {
    code: Permissions.vendors.update,
    name: "تعديل الموردين",
    description: "تعديل بيانات الموردين.",
  },
  {
    code: Permissions.vendors.delete,
    name: "حذف الموردين",
    description: "حذف الموردين وفق القيود المعتمدة.",
  },
  {
    code: Permissions.vendors.evaluate,
    name: "تقييم الموردين",
    description: "تسجيل واعتماد تقييمات الموردين.",
  },
] as const satisfies readonly PermissionCatalogEntry[];

export async function seedPermissions(
  prisma: PrismaClient,
) {
  const records = new Map<
    PermissionCode,
    { id: string; code: string }
  >();

  for (const permission of PERMISSION_CATALOG) {
    const record = await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {
        name: permission.name,
        description: permission.description,
      },
      create: {
        code: permission.code,
        name: permission.name,
        description: permission.description,
      },
      select: {
        id: true,
        code: true,
      },
    });

    records.set(permission.code, record);
  }

  return records;
}
