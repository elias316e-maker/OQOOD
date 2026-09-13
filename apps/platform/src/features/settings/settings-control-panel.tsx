"use client";

import {
  useActionState } from "react";

import {
  Alert,
  FormActions,
  FormGuidance,
  FormSection,
  EmptyState,
} from "@oqood/design-system";

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
type Invitation = { id: string; email: string; roleName: string; expiresAt: string };

type Props = {
  workspace: { nameAr: string; nameEn: string | null; timezone: string; defaultCurrency: string; defaultLanguage: string };
  roles: Role[];
  members: Member[];
  permissions: Permission[];
  canUpdateWorkspace: boolean;
  canManageMembers: boolean;
  canManageRoles: boolean;
  currentMemberId: string;
  currentUserIsOwner: boolean;
  invitations: Invitation[];
};

const initialState: SettingsActionState = { status: "idle" };

export function SettingsControlPanel(props: Props) {
  const [state, action, pending] = useActionState(manageSettingsAction, initialState);
  const assignableRoles = props.roles.filter(
    (role) => role.code !== "OWNER",
  );

  const ownershipCandidates =
    props.members.filter(
      (member) =>
        member.status === "ACTIVE" &&
        member.id !==
          props.currentMemberId,
    );
  const permissionGroups = Object.entries(
    props.permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const key = permission.code.split(".")[0] ?? "other";
      groups[key] = [...(groups[key] ?? []), permission];
      return groups;
    }, {}),
  );

  return (
    <div className={styles.stack}>
      {state.message ? (
        <Alert
          className={styles.notice}
          tone={
            state.status === "success"
              ? "success"
              : "danger"
          }
          title={
            state.status === "success"
              ? "تم تنفيذ الإجراء"
              : "تعذر تنفيذ الإجراء"
          }
          aria-live={
            state.status === "success"
              ? "polite"
              : "assertive"
          }
        >
          {state.message}
        </Alert>
      ) : null}

      <FormSection
        className={`${styles.panel} ${styles.workspacePanel}`}
        eyebrow="الهوية والتفضيلات"
        title="إعدادات مساحة العمل"
        description="البيانات الافتراضية التي تنعكس على جميع أعضاء مساحة العمل."
      >
        <form
          action={action}
          className={`${styles.form} ${styles.workspaceForm}`}
        >
          <input
            name="intent"
            type="hidden"
            value="update-workspace"
          />

          <FormGuidance
            className={styles.workspaceGuidance}
            icon="✦"
            title="راجع الهوية والإعدادات الافتراضية"
            description="تؤثر المنطقة الزمنية والعملة واللغة في جميع العمليات والتقارير الجديدة."
          />

          <div className={styles.workspaceFields}>
            <label htmlFor="workspace-name-ar">
              الاسم بالعربية

              <input
                defaultValue={
                  props.workspace.nameAr
                }
                disabled={
                  !props.canUpdateWorkspace
                }
                id="workspace-name-ar"
                maxLength={120}
                name="nameAr"
                required
              />
            </label>

            <label htmlFor="workspace-name-en">
              الاسم بالإنجليزية

              <input
                defaultValue={
                  props.workspace.nameEn ??
                  ""
                }
                disabled={
                  !props.canUpdateWorkspace
                }
                id="workspace-name-en"
                maxLength={120}
                name="nameEn"
              />
            </label>

            <label htmlFor="workspace-timezone">
              المنطقة الزمنية

              <select
                defaultValue={
                  props.workspace.timezone
                }
                disabled={
                  !props.canUpdateWorkspace
                }
                id="workspace-timezone"
                name="timezone"
              >
                <option value="Asia/Riyadh">
                  Asia/Riyadh
                </option>

                <option value="Asia/Dubai">
                  Asia/Dubai
                </option>

                <option value="Asia/Kuwait">
                  Asia/Kuwait
                </option>

                <option value="UTC">
                  UTC
                </option>
              </select>
            </label>

            <label htmlFor="workspace-currency">
              العملة

              <select
                defaultValue={props.workspace.defaultCurrency}
                disabled={
                  !props.canUpdateWorkspace
                }
                id="workspace-currency"
                name="defaultCurrency"
              >
                {[
                  "SAR",
                  "USD",
                  "AED",
                  "KWD",
                  "BHD",
                  "QAR",
                  "OMR",
                ].map((currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="workspace-language">
              اللغة

              <select
                defaultValue={props.workspace.defaultLanguage}
                disabled={
                  !props.canUpdateWorkspace
                }
                id="workspace-language"
                name="defaultLanguage"
              >
                <option value="ar">
                  العربية
                </option>

                <option value="en">
                  English
                </option>
              </select>
            </label>
          </div>

          {props.canUpdateWorkspace ? (
            <FormActions
              className={
                styles.workspaceActions
              }
              status="تُطبق التغييرات على مساحة العمل بعد الحفظ مباشرة."
            >
              <button
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "جارٍ حفظ الإعدادات..."
                  : "حفظ الإعدادات"}
              </button>
            </FormActions>
          ) : null}
        </form>
      </FormSection>

      <FormSection
        className={`${styles.panel} ${styles.membersPanel}`}
        eyebrow="الوصول والعضويات"
        title="أعضاء الفريق"
        description="إدارة الأعضاء الحاليين والدعوات المعلقة وأدوار الوصول."
        actions={
          <small className={styles.sectionCount}>
            {props.members.length} عضو
          </small>
        }
      >
        {props.canManageMembers ? (
          <form
            action={action}
            className={styles.invite}
          >
            <input
              name="intent"
              type="hidden"
              value="add-member"
            />

            <FormGuidance
              className={styles.inviteGuidance}
              icon="＋"
              title="إضافة عضو أو إرسال دعوة"
              description="إذا كان البريد مسجلًا فسيُضاف العضو مباشرة، وإلا ستُنشأ دعوة صالحة لمدة سبعة أيام."
            />

            <div className={styles.inviteFields}>
              <label htmlFor="settings-member-email">
                البريد الإلكتروني

                <input
                  autoComplete="email"
                  id="settings-member-email"
                  name="email"
                  placeholder="name@company.sa"
                  required
                  type="email"
                />
              </label>

              <label htmlFor="settings-member-role">
                الدور

                <select
                  id="settings-member-role"
                  name="roleId"
                  required
                >
                  {assignableRoles.map(
                    (role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <FormActions
              className={styles.inviteActions}
              status="لن يتم منح دور المالك من هذا النموذج؛ استخدم إجراء نقل الملكية المخصص."
            >
              <button
                disabled={
                  pending ||
                  assignableRoles.length === 0
                }
                type="submit"
              >
                {pending
                  ? "جارٍ تنفيذ الإجراء..."
                  : "إضافة عضو أو إرسال دعوة"}
              </button>
            </FormActions>
          </form>
        ) : (
          <FormGuidance
            className={styles.readOnlyGuidance}
            icon="⌁"
            title="وضع القراءة فقط"
            description="يمكنك الاطلاع على أعضاء الفريق، لكن صلاحية إضافة الأعضاء أو تعديلهم غير متاحة لحسابك."
          />
        )}

        {props.invitations.length > 0 ? (
          <section
            aria-labelledby="pending-invitations-title"
            className={styles.subsection}
          >
            <div className={styles.subsectionHeader}>
              <div>
                <span>
                  دعوات لم تُقبل بعد
                </span>

                <h3 id="pending-invitations-title">
                  الدعوات المعلقة
                </h3>
              </div>

              <small>
                {props.invitations.length} دعوة
              </small>
            </div>

            <div
              className={`${styles.memberList} ${styles.invitationList}`}
            >
              {props.invitations.map(
                (invitation) => (
                  <article key={invitation.id}>
                    <div className={styles.identity}>
                      <div
                        className={
                          styles.identityHeading
                        }
                      >
                        <strong>
                          {invitation.email}
                        </strong>

                        <span
                          className={
                            styles.pendingBadge
                          }
                        >
                          دعوة معلقة
                        </span>
                      </div>

                      <span>
                        الدور:{" "}
                        {invitation.roleName}
                      </span>

                      <small>
                        تنتهي{" "}
                        {new Intl.DateTimeFormat(
                          "ar-SA",
                          {
                            dateStyle:
                              "medium",
                          },
                        ).format(
                          new Date(
                            invitation.expiresAt,
                          ),
                        )}
                      </small>
                    </div>

                    {props.canManageMembers ? (
                      <form
                        action={action}
                        className={
                          styles.rowActionForm
                        }
                      >
                        <input
                          name="intent"
                          type="hidden"
                          value="revoke-invitation"
                        />

                        <input
                          name="invitationId"
                          type="hidden"
                          value={invitation.id}
                        />

                        <button
                          className={`${styles.rowAction} ${styles.rowActionDanger}`}
                          disabled={pending}
                          type="submit"
                        >
                          إلغاء الدعوة
                        </button>
                      </form>
                    ) : null}
                  </article>
                ),
              )}
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby="workspace-members-title"
          className={styles.subsection}
        >
          <div className={styles.subsectionHeader}>
            <div>
              <span>
                العضويات الفعالة والمعلقة
              </span>

              <h3 id="workspace-members-title">
                الأعضاء الحاليون
              </h3>
            </div>

            <small>
              {props.members.length} عضو
            </small>
          </div>

          {props.members.length > 0 ? (
            <div className={styles.memberList}>
              {props.members.map(
                (member) => (
                  <article key={member.id}>
                    <div className={styles.identity}>
                      <div
                        className={
                          styles.identityHeading
                        }
                      >
                        <strong>
                          {member.user.name}
                        </strong>

                        <div
                          className={
                            styles.identityBadges
                          }
                        >
                          {member.id ===
                          props.currentMemberId ? (
                            <span
                              className={
                                styles.currentBadge
                              }
                            >
                              أنت
                            </span>
                          ) : null}

                          {member.isOwner ? (
                            <span
                              className={
                                styles.ownerBadge
                              }
                            >
                              مالك المساحة
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span>
                        {member.user.email}
                      </span>

                      <small>
                        انضم{" "}
                        {new Intl.DateTimeFormat(
                          "ar-SA",
                          {
                            dateStyle:
                              "medium",
                          },
                        ).format(
                          new Date(
                            member.joinedAt,
                          ),
                        )}
                      </small>
                    </div>

                    <form
                      action={action}
                      className={
                        styles.memberControls
                      }
                    >
                      <input
                        name="intent"
                        type="hidden"
                        value="update-member"
                      />

                      <input
                        name="memberId"
                        type="hidden"
                        value={member.id}
                      />

                      <label
                        htmlFor={`member-role-${member.id}`}
                      >
                        <span>الدور</span>

                        <select
                          defaultValue={
                            member.roleIds[0]
                          }
                          disabled={
                            !props.canManageMembers ||
                            member.isOwner
                          }
                          id={`member-role-${member.id}`}
                          name="roleId"
                        >
                          {(member.isOwner
                            ? props.roles
                            : assignableRoles
                          ).map((role) => (
                            <option
                              key={role.id}
                              value={role.id}
                            >
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label
                        htmlFor={`member-status-${member.id}`}
                      >
                        <span>الحالة</span>

                        <select
                          defaultValue={
                            member.status
                          }
                          disabled={
                            !props.canManageMembers ||
                            member.isOwner
                          }
                          id={`member-status-${member.id}`}
                          name="status"
                        >
                          <option value="ACTIVE">
                            نشط
                          </option>

                          <option value="SUSPENDED">
                            معلّق
                          </option>
                        </select>
                      </label>

                      {props.canManageMembers &&
                      !member.isOwner ? (
                        <button
                          className={
                            styles.rowAction
                          }
                          disabled={pending}
                          type="submit"
                        >
                          {pending
                            ? "جارٍ التحديث..."
                            : "تحديث"}
                        </button>
                      ) : null}

                      {member.isOwner ? (
                        <em>محمي</em>
                      ) : null}
                    </form>
                  </article>
                ),
              )}
            </div>
          ) : (
            <EmptyState
              className={styles.compactEmpty}
              icon="♙"
              title="لا يوجد أعضاء في مساحة العمل"
              description="أضف أول عضو إلى الفريق لبدء توزيع الأدوار والصلاحيات."
              role="status"
            />
          )}
        </section>
      </FormSection>

      {props.currentUserIsOwner ? (
        <FormSection
          className={`${styles.panel} ${styles.ownershipPanel}`}
          eyebrow="إجراء حساس"
          title="نقل ملكية مساحة العمل"
          description="ينتقل دور المالك بالكامل إلى عضو نشط آخر، ويُعاد تعيين دورك بعد النقل."
          actions={
            <span
              className={
                styles.sensitiveBadge
              }
            >
              يتطلب تأكيدًا
            </span>
          }
        >
          <form
            action={action}
            className={
              styles.ownershipForm
            }
          >
            <input
              name="intent"
              type="hidden"
              value="transfer-ownership"
            />

            <FormGuidance
              className={
                styles.ownershipGuidance
              }
              icon="!"
              title="راجع العضو والدور قبل التأكيد"
              description="نقل الملكية إجراء جوهري؛ سيصبح العضو المحدد هو المالك الوحيد لمساحة العمل."
            />

            <div
              className={
                styles.ownershipFields
              }
            >
              <label htmlFor="ownership-target-member">
                المالك الجديد

                <select
                  disabled={
                    pending ||
                    ownershipCandidates
                      .length === 0
                  }
                  id="ownership-target-member"
                  name="targetMemberId"
                  required
                >
                  <option value="">
                    اختر عضوًا نشطًا
                  </option>

                  {ownershipCandidates.map(
                    (member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.user.name}
                        {" — "}
                        {member.user.email}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label htmlFor="ownership-fallback-role">
                دورك بعد النقل

                <select
                  disabled={
                    pending ||
                    assignableRoles
                      .length === 0
                  }
                  id="ownership-fallback-role"
                  name="fallbackRoleId"
                  required
                >
                  {assignableRoles.map(
                    (role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <FormActions
              className={
                styles.ownershipActions
              }
              status={
                ownershipCandidates.length ===
                0
                  ? "لا يوجد عضو نشط آخر مؤهل لنقل الملكية إليه."
                  : "بعد النقل ستفقد صلاحيات المالك ويُطبق عليك الدور المحدد."
              }
            >
              <button
                className={
                  styles.dangerButton
                }
                disabled={
                  pending ||
                  ownershipCandidates
                    .length === 0 ||
                  assignableRoles
                    .length === 0
                }
                type="submit"
              >
                {pending
                  ? "جارٍ نقل الملكية..."
                  : "تأكيد نقل الملكية"}
              </button>
            </FormActions>
          </form>
        </FormSection>
      ) : null}

      <FormSection
        className={`${styles.panel} ${styles.rolesPanel}`}
        eyebrow="التحكم الدقيق"
        title="الأدوار والصلاحيات"
        description="عرض الأدوار النظامية وإنشاء أدوار مخصصة وتحديد صلاحيات كل دور."
        actions={
          <small
            className={styles.sectionCount}
          >
            {props.roles.length} أدوار
          </small>
        }
      >
        {props.roles.length > 0 ? (
          <div className={styles.roles}>
            {props.roles.map((role) => (
              <article
                className={styles.roleCard}
                key={role.id}
              >
                <div
                  className={
                    styles.roleCardHeader
                  }
                >
                  <div>
                    <strong>
                      {role.name}
                    </strong>

                    <small
                      className={
                        styles.roleCode
                      }
                    >
                      {role.code}
                    </small>
                  </div>

                  <span
                    className={
                      role.isSystem
                        ? styles.systemBadge
                        : styles.customBadge
                    }
                  >
                    {role.isSystem
                      ? "نظامي"
                      : "مخصص"}
                  </span>
                </div>

                <p>
                  {role.description ??
                    "دور مخصص لمساحة العمل"}
                </p>

                <small
                  className={
                    styles.permissionCount
                  }
                >
                  {role.permissionCodes.length}
                  {" "}
                  صلاحية
                </small>

                {props.canManageRoles &&
                !role.isSystem &&
                role.code !== "OWNER" ? (
                  <details
                    className={
                      styles.roleDetails
                    }
                  >
                    <summary>
                      تعديل الدور والصلاحيات
                    </summary>

                    <form
                      action={action}
                      className={
                        styles.roleForm
                      }
                    >
                      <input
                        name="intent"
                        type="hidden"
                        value="update-role"
                      />

                      <input
                        name="roleId"
                        type="hidden"
                        value={role.id}
                      />

                      <div
                        className={
                          styles.roleFields
                        }
                      >
                        <label
                          htmlFor={`role-name-${role.id}`}
                        >
                          اسم الدور

                          <input
                            defaultValue={
                              role.name
                            }
                            id={`role-name-${role.id}`}
                            name="name"
                            required
                          />
                        </label>

                        <label
                          htmlFor={`role-description-${role.id}`}
                        >
                          الوصف

                          <input
                            defaultValue={
                              role.description ??
                              ""
                            }
                            id={`role-description-${role.id}`}
                            name="description"
                          />
                        </label>
                      </div>

                      <div
                        aria-label={`صلاحيات دور ${role.name}`}
                        className={
                          styles.permissions
                        }
                      >
                        {permissionGroups.map(
                          ([
                            group,
                            permissions,
                          ]) => (
                            <fieldset
                              key={group}
                            >
                              <legend>
                                {group}
                              </legend>

                              {permissions.map(
                                (
                                  permission,
                                ) => (
                                  <label
                                    key={
                                      permission.code
                                    }
                                  >
                                    <input
                                      defaultChecked={role.permissionCodes.includes(
                                        permission.code,
                                      )}
                                      name="permissions"
                                      type="checkbox"
                                      value={
                                        permission.code
                                      }
                                    />

                                    <span>
                                      <strong>
                                        {
                                          permission.name
                                        }
                                      </strong>

                                      <small>
                                        {
                                          permission.code
                                        }
                                      </small>
                                    </span>
                                  </label>
                                ),
                              )}
                            </fieldset>
                          ),
                        )}
                      </div>

                      <FormActions
                        className={
                          styles.roleActions
                        }
                        status={`${role.permissionCodes.length} صلاحية مرتبطة بالدور حاليًا.`}
                      >
                        <button
                          disabled={pending}
                          type="submit"
                        >
                          {pending
                            ? "جارٍ الحفظ..."
                            : "حفظ تعديلات الدور"}
                        </button>
                      </FormActions>
                    </form>

                    <form
                      action={action}
                      className={
                        styles.deleteRoleForm
                      }
                    >
                      <input
                        name="intent"
                        type="hidden"
                        value="delete-role"
                      />

                      <input
                        name="roleId"
                        type="hidden"
                        value={role.id}
                      />

                      <FormActions
                        className={
                          styles.roleDeleteActions
                        }
                        status="يمكن حذف الدور فقط إذا لم يكن مرتبطًا بأي عضو."
                      >
                        <button
                          className={
                            styles.dangerButton
                          }
                          disabled={pending}
                          type="submit"
                        >
                          حذف الدور غير المستخدم
                        </button>
                      </FormActions>
                    </form>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className={styles.compactEmpty}
            icon="⌘"
            title="لا توجد أدوار معرفة"
            description="أنشئ أول دور مخصص لتوزيع الصلاحيات على أعضاء الفريق."
            role="status"
          />
        )}

        {props.canManageRoles ? (
          <form
            action={action}
            className={`${styles.roleForm} ${styles.createRoleForm}`}
          >
            <input
              name="intent"
              type="hidden"
              value="create-role"
            />

            <FormGuidance
              className={
                styles.roleGuidance
              }
              icon="＋"
              title="إنشاء دور مخصص"
              description="حدد اسم الدور ووصفه ثم اختر أقل مجموعة صلاحيات لازمة لأداء مسؤولياته."
            />

            <div
              className={styles.roleFields}
            >
              <label htmlFor="new-role-name">
                اسم الدور

                <input
                  id="new-role-name"
                  name="name"
                  placeholder="مثال: مسؤول العقود"
                  required
                />
              </label>

              <label htmlFor="new-role-description">
                الوصف

                <input
                  id="new-role-description"
                  name="description"
                  placeholder="نطاق مسؤوليات الدور"
                />
              </label>
            </div>

            <div
              aria-label="صلاحيات الدور الجديد"
              className={styles.permissions}
            >
              {permissionGroups.map(
                ([
                  group,
                  permissions,
                ]) => (
                  <fieldset key={group}>
                    <legend>
                      {group}
                    </legend>

                    {permissions.map(
                      (permission) => (
                        <label
                          key={
                            permission.code
                          }
                        >
                          <input
                            name="permissions"
                            type="checkbox"
                            value={
                              permission.code
                            }
                          />

                          <span>
                            <strong>
                              {permission.name}
                            </strong>

                            <small>
                              {permission.code}
                            </small>
                          </span>
                        </label>
                      ),
                    )}
                  </fieldset>
                ),
              )}
            </div>

            <FormActions
              className={styles.roleActions}
              status="يمكن تعديل الدور أو حذفه لاحقًا ما دام غير نظامي وغير مستخدم."
            >
              <button
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "جارٍ إنشاء الدور..."
                  : "إنشاء الدور"}
              </button>
            </FormActions>
          </form>
        ) : (
          <FormGuidance
            className={
              styles.rolesReadOnlyGuidance
            }
            icon="⌁"
            title="عرض الأدوار فقط"
            description="صلاحية إنشاء الأدوار وتعديلها غير متاحة لحسابك الحالي."
          />
        )}
      </FormSection>
    </div>
  );
}
