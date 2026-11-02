import { Button, H3, StatusIndicator, Text } from "@salt-ds/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLink, plural } from "../../components/admin-ui/AdminUi";
import { useEditingLock } from "../../components/EditingContext";
import { UserAccessEditor } from "../../components/UserAccessEditor";
import {
  accessAssignments,
  createUserOperations,
  type UserAccess,
  type UserDetails,
  validateUserDetails,
} from "../../data/admin-plans";
import {
  type AdminOperation,
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import { useAdminPaths } from "../../data/useAdminPaths";
import { useApplicationModel } from "../../data/useApplicationModel";
import { accessOptionsFrom, UserDetailsFields } from "./UserDetailsFields";

import "./UserPage.css";

const classBase = "vuuAdminUser";

const EMPTY_DETAILS: UserDetails = {
  email: "",
  enabled: true,
  firstName: "",
  lastName: "",
  temporaryPassword: "",
  username: "",
};

/** Creates a user and gives them access to applications in one step. */
export const CreateUserPage = () => {
  const paths = useAdminPaths();
  const navigate = useNavigate();
  const rpc = useAdminRpc();
  const setEditing = useEditingLock();
  const { showNotification } = useNotifications();
  const { loading, model } = useApplicationModel();
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [access, setAccess] = useState<UserAccess>(() => new Map());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  // Once the user exists, a retry runs only the calls that are left.
  const [remaining, setRemaining] = useState<AdminOperation[]>();

  const options = useMemo(() => accessOptionsFrom(model), [model]);
  const errors = submitted ? validateUserDetails(details, { isNew: true }) : {};
  const groupCount = accessAssignments(access).length;
  const applicationCount = [...access.values()].filter(
    (g) => g.size > 0,
  ).length;
  const dirty = details !== EMPTY_DETAILS || groupCount > 0;
  const created = remaining !== undefined;

  useEffect(() => {
    setEditing(dirty);
  }, [dirty, setEditing]);
  useEffect(() => () => setEditing(false), [setEditing]);

  const save = async () => {
    setSubmitted(true);
    if (
      !created &&
      Object.keys(validateUserDetails(details, { isNew: true })).length > 0
    ) {
      return;
    }
    const operations =
      remaining ?? createUserOperations(model, details, access);
    setSaving(true);
    const result = await runOperations(rpc, operations);
    setSaving(false);
    if (result.failed) {
      const userCreated =
        created ||
        result.completed.some(({ rpcName }) => rpcName === "addUser");
      setRemaining(userCreated ? result.remaining : undefined);
      setError(describeFailure(result));
      return;
    }
    setEditing(false);
    showNotification({
      type: "toast",
      status: "success",
      header: "User created",
      content:
        groupCount > 0
          ? `${details.username} can use ${plural(applicationCount, "application")}.`
          : `${details.username} has no application access yet.`,
    });
    navigate(paths.users);
  };

  return (
    <section
      aria-label="New user"
      className={`vuuIdentityAdmin-page ${classBase}`}
    >
      <nav aria-label="Breadcrumb" className="vuuAdminApplication-breadcrumb">
        <AdminLink to={paths.users}>Users</AdminLink>
        <Text color="secondary"> / New user</Text>
      </nav>
      <div className={`${classBase}-columns`}>
        <section
          aria-labelledby="new-user-details"
          className={`${classBase}-column`}
        >
          <H3 id="new-user-details">Details</H3>
          <UserDetailsFields
            details={details}
            disabled={saving || created}
            errors={errors}
            isNew
            onChange={setDetails}
          />
        </section>
        <section
          aria-labelledby="new-user-access"
          className={`${classBase}-column`}
        >
          <H3 id="new-user-access">Application access</H3>
          <Text color="secondary">
            Tick an application to add the user to its default group, then
            change the groups if they need more.
          </Text>
          {loading ? (
            <Text color="secondary">Loading applications…</Text>
          ) : (
            <UserAccessEditor
              disabled={saving || created}
              draft={access}
              onChange={setAccess}
              options={options}
            />
          )}
        </section>
      </div>
      <div
        aria-label="Create user"
        className="vuuIdentityAdmin-saveBar"
        role="region"
      >
        <span className="vuuIdentityAdmin-saveBarText">
          {error ? (
            <span role="alert">
              <StatusIndicator status="error" /> {error}
            </span>
          ) : (
            <Text color="secondary">
              {groupCount > 0
                ? `Access to ${plural(applicationCount, "application")} through ${plural(groupCount, "group")}.`
                : "No application access yet."}
            </Text>
          )}
        </span>
        <span className="vuuAdminUi-actions">
          <Button disabled={saving} onClick={() => navigate(paths.users)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={save} sentiment="accented">
            {created ? "Retry" : "Create user"}
          </Button>
        </span>
      </div>
    </section>
  );
};
