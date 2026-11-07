import {
  Avatar,
  Banner,
  BannerContent,
  Button,
  H2,
  StatusIndicator,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Tag,
  Text,
} from "@salt-ds/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLink, plural } from "../../components/admin-ui/AdminUi";
import { useEditingLock } from "../../components/EditingContext";
import { UserAccessEditor } from "../../components/UserAccessEditor";
import {
  accessChanges,
  type UserAccess,
  type UserDetails,
  updateUserOperation,
  userAccessOperation,
  validateUserDetails,
} from "../../data/admin-plans";
import {
  type AdminOperation,
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import { errorMessage } from "../../data/admin-contract";
import { parseUserModuleAccess } from "../../data/module-access";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import { useAdminPaths } from "../../data/useAdminPaths";
import { useApplicationModel } from "../../data/useApplicationModel";
import {
  USER_SUMMARY_COLUMNS,
  type UserSummary,
  userName,
  userSummaryFrom,
} from "../../data/useApplicationUsers";
import { useLookupRows } from "../../data/useLookupRows";
import { accessOptionsFrom, UserDetailsFields } from "./UserDetailsFields";

import "./UserPage.css";

const classBase = "vuuAdminUser";
const USER_ID = /^[A-Za-z0-9._@-]+$/;

type UserTab = "access" | "details";

const detailsFrom = (user: UserSummary): UserDetails => ({
  email: user.email,
  enabled: user.enabled,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
});

interface SavedAccess {
  access: UserAccess;
  /** Each application's default group, by access role. */
  defaults: ReadonlyMap<string, string>;
}

/** The user's groups per application, as the server reports them. */
const useSavedAccess = (userId: string) => {
  const rpc = useAdminRpc();
  const [state, setState] = useState<{ error?: string; saved?: SavedAccess }>(
    {},
  );
  const load = useCallback(async () => {
    try {
      const { modules } = parseUserModuleAccess(
        await rpc("getUserModuleAccessOptions", { userId }),
      );
      const access = new Map<string, ReadonlySet<string>>();
      const defaults = new Map<string, string>();
      for (const module of modules) {
        access.set(module.accessRole, new Set(module.selectedGroupIds));
        const fallback = module.groups.find(({ isDefault }) => isDefault);
        if (fallback) defaults.set(module.accessRole, fallback.groupId);
      }
      setState({ saved: { access, defaults } });
    } catch (cause) {
      setState({ error: errorMessage(cause) });
    }
  }, [rpc, userId]);
  useEffect(() => {
    setState({});
    load();
  }, [load]);
  return { ...state, reload: load };
};

const AccessTab = ({ user }: { user: UserSummary }) => {
  const rpc = useAdminRpc();
  const setEditing = useEditingLock();
  const { showNotification } = useNotifications();
  const { model } = useApplicationModel();
  const { error: loadError, reload, saved } = useSavedAccess(user.userId);
  const [draft, setDraft] = useState<UserAccess>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const options = useMemo(
    () => accessOptionsFrom(model, saved?.defaults),
    [model, saved?.defaults],
  );
  const current = draft ?? saved?.access ?? new Map();
  const changes = saved ? accessChanges(saved.access, current) : [];
  const dirty = changes.length > 0;

  useEffect(() => {
    setEditing(dirty);
  }, [dirty, setEditing]);
  useEffect(() => () => setEditing(false), [setEditing]);

  const save = async () => {
    setSaving(true);
    const result = await runOperations(rpc, [
      userAccessOperation(user, current),
    ]);
    setSaving(false);
    if (result.failed) {
      setError(describeFailure(result));
      return;
    }
    setError(undefined);
    await reload();
    setDraft(undefined);
    showNotification({
      type: "toast",
      status: "success",
      header: "Access updated",
      content: `${plural(changes.length, "application")} changed for ${user.username}.`,
    });
  };

  if (loadError) {
    return (
      <Banner status="error">
        <BannerContent role="alert">{loadError}</BannerContent>
      </Banner>
    );
  }
  if (!saved) return <Text color="secondary">Loading access…</Text>;

  const describe = (accessRole: string) =>
    model.applications.find(
      ({ application }) => application.accessRole === accessRole,
    )?.application.title ?? accessRole;

  return (
    <div className={`${classBase}-tab`}>
      <UserAccessEditor
        disabled={saving}
        draft={current}
        onChange={setDraft}
        options={options}
        saved={saved.access}
      />
      {dirty || error ? (
        <div
          aria-label="Unsaved changes"
          className="vuuIdentityAdmin-saveBar"
          role="region"
        >
          <span className="vuuIdentityAdmin-saveBarText">
            {dirty ? (
              <Tag category={11}>
                {plural(changes.length, "unsaved application")}
              </Tag>
            ) : null}
            {error ? (
              <span role="alert">
                <StatusIndicator status="error" /> {error}
              </span>
            ) : (
              <Text color="secondary">
                {changes
                  .map(({ accessRole }) => describe(accessRole))
                  .join(" · ")}
              </Text>
            )}
          </span>
          <span className="vuuAdminUi-actions">
            <Button
              disabled={saving || !dirty}
              onClick={() => {
                setDraft(undefined);
                setError(undefined);
              }}
            >
              Discard
            </Button>
            <Button
              disabled={saving || !dirty}
              onClick={save}
              sentiment="accented"
            >
              Save access
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
};

const DetailsTab = ({ user }: { user: UserSummary }) => {
  const rpc = useAdminRpc();
  const setEditing = useEditingLock();
  const { showNotification } = useNotifications();
  const saved = useMemo(() => detailsFrom(user), [user]);
  const [details, setDetails] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const errors = validateUserDetails(details, { isNew: false });
  const dirty = JSON.stringify(details) !== JSON.stringify(saved);

  useEffect(() => setDetails(saved), [saved]);
  useEffect(() => {
    setEditing(dirty);
  }, [dirty, setEditing]);
  useEffect(() => () => setEditing(false), [setEditing]);

  const save = async () => {
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    const result = await runOperations(rpc, [
      updateUserOperation(user.userId, details),
    ]);
    setSaving(false);
    if (result.failed) {
      setError(describeFailure(result));
      return;
    }
    setError(undefined);
    showNotification({
      type: "toast",
      status: "success",
      header: "User updated",
      content: `${user.username} was saved.`,
    });
  };

  return (
    <div className={`${classBase}-tab ${classBase}-detailsTab`}>
      <UserDetailsFields
        details={details}
        disabled={saving}
        errors={dirty ? errors : {}}
        isNew={false}
        onChange={setDetails}
      />
      {dirty || error ? (
        <div
          aria-label="Unsaved changes"
          className="vuuIdentityAdmin-saveBar"
          role="region"
        >
          <span className="vuuIdentityAdmin-saveBarText">
            {error ? (
              <span role="alert">
                <StatusIndicator status="error" /> {error}
              </span>
            ) : (
              <Tag category={11}>Unsaved details</Tag>
            )}
          </span>
          <span className="vuuAdminUi-actions">
            <Button
              disabled={saving}
              onClick={() => {
                setDetails(saved);
                setError(undefined);
              }}
            >
              Discard
            </Button>
            <Button
              disabled={saving || Object.keys(errors).length > 0}
              onClick={save}
              sentiment="accented"
            >
              Save details
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
};

const UserWorkspace = ({ user }: { user: UserSummary }) => {
  const paths = useAdminPaths();
  const rpc = useAdminRpc();
  const { showNotification } = useNotifications();
  const [tab, setTab] = useState<UserTab>("access");
  const [toggling, setToggling] = useState(false);
  const name = userName(user);

  const toggleEnabled = async () => {
    setToggling(true);
    const operation: AdminOperation = updateUserOperation(user.userId, {
      ...detailsFrom(user),
      enabled: !user.enabled,
    });
    const result = await runOperations(rpc, [operation]);
    setToggling(false);
    showNotification(
      result.failed
        ? {
            type: "toast",
            status: "error",
            header: "User not updated",
            content: describeFailure(result),
          }
        : {
            type: "toast",
            status: "success",
            header: user.enabled ? "User disabled" : "User enabled",
            content: `${user.username} ${user.enabled ? "can no longer" : "can now"} sign in.`,
          },
    );
  };

  return (
    <section aria-label={name} className={`vuuIdentityAdmin-page ${classBase}`}>
      <nav aria-label="Breadcrumb" className="vuuAdminApplication-breadcrumb">
        <AdminLink to={paths.overview}>Overview</AdminLink>
        <Text color="secondary"> / {name}</Text>
      </nav>
      <header className={`${classBase}-header`}>
        <Avatar name={name} size={2.5} />
        <div className="vuuAdminUi-stack">
          <span className={`${classBase}-title`}>
            <H2>{name}</H2>
            <Tag category={user.enabled ? 3 : 11}>
              {user.enabled ? "Enabled" : "Disabled"}
            </Tag>
          </span>
          <Text color="secondary">
            {user.username}
            {user.email ? ` · ${user.email}` : ""}
          </Text>
        </div>
        <Button disabled={toggling} onClick={toggleEnabled}>
          {user.enabled ? "Disable user" : "Enable user"}
        </Button>
      </header>
      <Tabs onChange={(_event, value) => setTab(value as UserTab)} value={tab}>
        <TabBar divider>
          <TabList aria-label={`${name} sections`}>
            <Tab value="access">
              <TabTrigger>Application access</TabTrigger>
            </Tab>
            <Tab value="details">
              <TabTrigger>Details</TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <TabPanel value="access">
          <AccessTab user={user} />
        </TabPanel>
        <TabPanel value="details">
          <DetailsTab user={user} />
        </TabPanel>
      </Tabs>
    </section>
  );
};

/** One user: the applications they can use, and their details. */
export const UserPage = ({ userId }: { userId: string }) => {
  const paths = useAdminPaths();
  const filter = useMemo(
    () =>
      USER_ID.test(userId)
        ? filterAsQuery({ column: "user_id", op: "=", value: userId })
        : undefined,
    [userId],
  );
  const { error, loading, rows } = useLookupRows(
    USER_ADMIN_TABLES.users,
    USER_SUMMARY_COLUMNS,
    !!filter,
    filter,
  );
  const user = useMemo(
    () =>
      rows[0] ? userSummaryFrom(rows[0] as Record<string, unknown>) : undefined,
    [rows],
  );

  if (user) return <UserWorkspace key={user.userId} user={user} />;
  return (
    <section className="vuuIdentityAdmin-page">
      <nav aria-label="Breadcrumb" className="vuuAdminApplication-breadcrumb">
        <AdminLink to={paths.overview}>Overview</AdminLink>
      </nav>
      {error ? (
        <Banner status="error">
          <BannerContent role="alert">{error}</BannerContent>
        </Banner>
      ) : loading ? (
        <Text color="secondary">Loading user…</Text>
      ) : (
        <p className="vuuIdentityAdmin-empty">No user has the ID {userId}.</p>
      )}
    </section>
  );
};
