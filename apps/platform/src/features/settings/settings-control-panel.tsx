"use client";

import { useActionState } from "react";

import { manageSettingsAction, type SettingsActionState } from "./actions";
import styles from "./settings-control-panel.module.css";

type Role = { id: string; code: string; name: string; description: string | null; isSystem: boolean; permissionCodes: string[] };
type Member = {
  id: string;
  status: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
  roleIds: string[];
  isOwner: boolean;
};
type Permission = { code: string; name: string; description: string | null };

type Props = {
  workspace: { nameAr: string; nameEn: string | null; timezone: string; defaultCurrency: string; defaultLanguage: string };
  roles: Role[];
  members: Member[];
  permissions: Permission[];
  canUpdateWorkspace: boolean;
  canManageMembers: boolean;
  canManageRoles: boolean;
};

const initialState: SettingsActionState = { status: "idle" };

export function SettingsControlPanel(props: Props) {
  const [state, action, pending] = useActionState(manageSettingsAction, initialState);
  const permissionGroups = Object.entries(
    props.permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const key = permission.code.split(".")[0] ?? "other";
      groups[key] = [...(groups[key] ?? []), permission];
      return groups;
    }, {}),
  );

  return (
    <div className={styles.stack}>
      {state.message && <div className={styles.notice} data-tone={state.status}>{state.message}</div>}

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><span>الهوية والتفضيلات</span><h2>إعدادات مساحة العمل</h2></div><small>تنعكس على جميع أعضاء الفريق</small></div>
        <form action={action} className={styles.form}>
          <input name="intent" type="hidden" value="update-workspace" />
          <label>الاسم بالعربية<input defaultValue={props.workspace.nameAr} disabled={!props.canUpdateWorkspace} name="nameAr" required /></label>
          <label>الاسم بالإنجليزية<input defaultValue={props.workspace.nameEn ?? ""} disabled={!props.canUpdateWorkspace} name="nameEn" /></label>
          <label>المنطقة الزمنية<select defaultValue={props.workspace.timezone} disabled={!props.canUpdateWorkspace} name="timezone"><option>Asia/Riyadh</option><option>Asia/Dubai</option><option>Asia/Kuwait</option><option>UTC</option></select></label>
          <label>العملة<select defaultValue={props.workspace.defaultCurrency} disabled={!props.canUpdateWorkspace} name="defaultCurrency">{["SAR","USD","AED","KWD","BHD","QAR","OMR"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label>اللغة<select defaultValue={props.workspace.defaultLanguage} disabled={!props.canUpdateWorkspace} name="defaultLanguage"><option value="ar">العربية</option><option value="en">English</option></select></label>
          {props.canUpdateWorkspace && <button disabled={pending}>حفظ الإعدادات</button>}
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><span>الوصول والعضويات</span><h2>أعضاء الفريق</h2></div><small>{props.members.length} عضو</small></div>
        {props.canManageMembers && <form action={action} className={styles.invite}>
          <input name="intent" type="hidden" value="add-member" />
          <label>البريد الإلكتروني<input name="email" placeholder="name@company.sa" required type="email" /></label>
          <label>الدور<select name="roleId" required>{props.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <button disabled={pending}>إضافة عضو مسجل</button>
        </form>}
        <div className={styles.memberList}>
          {props.members.map((member) => <article key={member.id}>
            <div className={styles.identity}><b>{member.user.name}</b><span>{member.user.email}</span><small>انضم {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(member.joinedAt))}</small></div>
            <form action={action} className={styles.memberControls}>
              <input name="intent" type="hidden" value="update-member" />
              <input name="memberId" type="hidden" value={member.id} />
              <select defaultValue={member.roleIds[0]} disabled={!props.canManageMembers || member.isOwner} name="roleId">
                {props.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
              <select defaultValue={member.status} disabled={!props.canManageMembers || member.isOwner} name="status"><option value="ACTIVE">نشط</option><option value="SUSPENDED">معلّق</option></select>
              {props.canManageMembers && !member.isOwner && <button disabled={pending}>تحديث</button>}
              {member.isOwner && <em>مالك المساحة</em>}
            </form>
          </article>)}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><span>التحكم الدقيق</span><h2>الأدوار والصلاحيات</h2></div><small>{props.roles.length} أدوار</small></div>
        <div className={styles.roles}>{props.roles.map((role) => <article key={role.id}><div><b>{role.name}</b>{role.isSystem && <span>نظامي</span>}</div><p>{role.description ?? "دور مخصص لمساحة العمل"}</p><small>{role.permissionCodes.length} صلاحية</small></article>)}</div>
        {props.canManageRoles && <form action={action} className={styles.roleForm}>
          <input name="intent" type="hidden" value="create-role" />
          <div className={styles.roleFields}><label>اسم الدور<input name="name" placeholder="مثال: مسؤول العقود" required /></label><label>الوصف<input name="description" placeholder="نطاق مسؤوليات الدور" /></label></div>
          <div className={styles.permissions}>{permissionGroups.map(([group, permissions]) => <fieldset key={group}><legend>{group}</legend>{permissions.map((permission) => <label key={permission.code}><input name="permissions" type="checkbox" value={permission.code} /><span><b>{permission.name}</b><small>{permission.code}</small></span></label>)}</fieldset>)}</div>
          <button disabled={pending}>إنشاء الدور</button>
        </form>}
      </section>
    </div>
  );
}
