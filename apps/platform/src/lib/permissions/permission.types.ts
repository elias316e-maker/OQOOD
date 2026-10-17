import { Permissions } from "./permission-registry";

type NestedValues<T> =
  T extends string
    ? T
    : T extends Record<string, unknown>
      ? NestedValues<T[keyof T]>
      : never;

export type PermissionCode =
  NestedValues<typeof Permissions>;

export type PermissionRecord = {
  id: string;
  code: PermissionCode;
  name: string;
  description: string | null;
};
