export const Permissions = {
  workspace: {
    read: "workspace.read",
    update: "workspace.update",
    manageMembers: "workspace.members.manage",
    manageRoles: "workspace.roles.manage",
    manageBilling: "workspace.billing.manage",
  },

  opportunities: {
    create: "opportunities.create",
    read: "opportunities.read",
    update: "opportunities.update",
    delete: "opportunities.delete",
    publish: "opportunities.publish",
    evaluate: "opportunities.evaluate",
    award: "opportunities.award",
  },

  contracts: {
    create: "contracts.create",
    read: "contracts.read",
    update: "contracts.update",
    delete: "contracts.delete",
    approve: "contracts.approve",
    sign: "contracts.sign",
  },

  procurement: {
    create: "procurement.create",
    read: "procurement.read",
    update: "procurement.update",
    delete: "procurement.delete",
    approve: "procurement.approve",
  },

  vendors: {
    create: "vendors.create",
    read: "vendors.read",
    update: "vendors.update",
    delete: "vendors.delete",
    evaluate: "vendors.evaluate",
  },
} as const;
