import {
  Button,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  Text,
} from "@salt-ds/core";
import {
  CloseIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  ErrorIcon,
  HistoryIcon,
  LayersIcon,
  LinkedIcon,
  LockedIcon,
  RefreshIcon,
  SignpostIcon,
  SuccessCircleIcon,
  VisibleIcon,
} from "@salt-ds/icons";
import cx from "clsx";
import { useState } from "react";
import type { ModuleView } from "../data/module-model";
import { formatDate, relativeTime } from "../data/module-model";
import { useModuleActions } from "./ModuleActions";
import {
  EnabledStatus,
  FactList,
  IssueBanner,
  MenuLocation,
  NavIcon,
  RoleTag,
  SectionHeading,
} from "./ui";

const classBase = "vuuModulePanel";

export const PanelHeader = ({
  eyebrow,
  module,
  onClose,
  subtitle,
}: {
  eyebrow?: string;
  module: ModuleView;
  onClose: () => void;
  subtitle?: string;
}) => (
  <header className={`${classBase}-header`}>
    <NavIcon name={module.name} size="large" url={module.navIconUrl} />
    <div className={`${classBase}-titles`}>
      {eyebrow ? (
        <Text color="secondary" styleAs="label">
          {eyebrow}
        </Text>
      ) : null}
      <h2 className={`${classBase}-title`}>{module.title}</h2>
      <code className={`${classBase}-subtitle`}>
        {subtitle ??
          `${module.name} · id ${module.id} · version ${module.version}`}
      </code>
    </div>
    <Button appearance="transparent" aria-label="Close" onClick={onClose}>
      <CloseIcon aria-hidden />
    </Button>
  </header>
);

export const RemoteCheckBox = ({
  module,
  onRecheck,
}: {
  module: ModuleView;
  onRecheck: () => void;
}) => {
  const check = module.remote;
  return (
    <div
      className={cx(
        `${classBase}-check`,
        check && `${classBase}-check-${check.status}`,
      )}
    >
      {check && check.status !== "checking" ? (
        <ul className={`${classBase}-checkItems`}>
          {check.items.map((item) => (
            <li key={item.label}>
              {item.ok ? (
                <SuccessCircleIcon
                  aria-label="Passed"
                  className={`${classBase}-ok`}
                />
              ) : (
                <ErrorIcon
                  aria-label="Failed"
                  className={`${classBase}-fail`}
                />
              )}
              <strong>{item.label}</strong>
              <code>{item.detail}</code>
            </li>
          ))}
        </ul>
      ) : (
        <Text color="secondary">
          {check?.status === "checking"
            ? "Checking remote…"
            : "Remote not checked yet."}
        </Text>
      )}
      <div className={`${classBase}-checkFooter`}>
        <Text color="secondary" styleAs="label">
          {check?.checkedAt
            ? `Checked from this browser ${relativeTime(check.checkedAt)}`
            : "Checks run from this browser, not the server"}
        </Text>
        <Button
          appearance="transparent"
          disabled={check?.status === "checking" || !module.mfUrl}
          onClick={onRecheck}
        >
          <RefreshIcon aria-hidden /> Re-check
        </Button>
      </div>
    </div>
  );
};

const ConfigurationTab = ({ module }: { module: ModuleView }) => {
  const actions = useModuleActions();
  return (
    <div className={`${classBase}-sections`}>
      {module.description ? <Text>{module.description}</Text> : null}
      {module.issues.map((issue) => (
        <IssueBanner key={issue.kind}>{issue.message}</IssueBanner>
      ))}
      <section>
        <SectionHeading icon={<SignpostIcon aria-hidden />}>
          Portal navigation
        </SectionHeading>
        <FactList
          facts={[
            ["Menu location", <MenuLocation key="m" module={module} />],
            ["Route", <code key="r">{module.path || "–"}</code>],
            [
              "Navigation icon",
              module.navIconUrl ? (
                <NavIcon
                  key="i"
                  name={module.name}
                  size="small"
                  url={module.navIconUrl}
                />
              ) : (
                "Default"
              ),
            ],
            ...(module.parent
              ? ([["Parent module", module.parent.title]] as [string, string][])
              : []),
          ]}
          variant="panel"
        />
      </section>
      <section>
        <SectionHeading icon={<LayersIcon aria-hidden />}>
          Module federation
        </SectionHeading>
        <FactList
          facts={[
            ["Scope", <code key="s">{module.mfScope}</code>],
            ["Exposed component", <code key="c">./{module.mfComponent}</code>],
            [
              "Remote URL",
              <a href={module.mfUrl} key="u" rel="noreferrer" target="_blank">
                <code>{module.mfUrl}</code>
              </a>,
            ],
          ]}
          variant="panel"
        />
        <RemoteCheckBox
          module={module}
          onRecheck={() => actions.checkRemote(module)}
        />
      </section>
      <section>
        <SectionHeading icon={<LinkedIcon aria-hidden />}>
          Vuu connection
        </SectionHeading>
        {module.vuuConnectionId ? (
          <FactList
            facts={[
              ["Connection id", <code key="i">{module.vuuConnectionId}</code>],
              ["WebSocket URL", <code key="w">{module.vuuWebsocketUrl}</code>],
              ["Auth (REST) URL", <code key="a">{module.vuuRestUrl}</code>],
            ]}
            variant="panel"
          />
        ) : (
          <Text color="secondary">
            Uses the portal's default Vuu connection.
          </Text>
        )}
      </section>
      <section>
        <SectionHeading icon={<HistoryIcon aria-hidden />}>
          Timestamps
        </SectionHeading>
        <Text color="secondary">
          Last updated {relativeTime(module.updated)} · created{" "}
          {formatDate(module.created)}
        </Text>
      </section>
    </div>
  );
};

const AccessTab = ({ module }: { module: ModuleView }) => (
  <div className={`${classBase}-sections`}>
    <section>
      <SectionHeading icon={<LockedIcon aria-hidden />}>Access</SectionHeading>
      <FactList
        facts={[
          ["Access role", <RoleTag key="r" module={module} />],
          [
            "Source",
            module.accessRoleInherited
              ? `Inherited from ${module.parent?.title ?? "parent"}`
              : module.accessRole
                ? "Set on this module"
                : "–",
          ],
          ["Status", <EnabledStatus enabled={module.enabled} key="s" />],
        ]}
        variant="panel"
      />
      <Text color="secondary">
        Users see this module when it is enabled and they hold the access role.
        Grant roles to groups in User Admin.
      </Text>
    </section>
    {module.children.length > 0 ? (
      <section>
        <SectionHeading icon={<VisibleIcon aria-hidden />}>
          Child modules
        </SectionHeading>
        <ul className={`${classBase}-children`}>
          {module.children.map((child) => (
            <li key={child.id}>
              <strong>{child.title}</strong>{" "}
              <Text color="secondary" styleAs="label">
                {child.accessRole
                  ? child.accessRole
                  : "inherits this module's role"}
              </Text>
            </li>
          ))}
        </ul>
      </section>
    ) : null}
  </div>
);

export const ModuleDetailsPanel = ({
  module,
  onClose,
}: {
  module: ModuleView;
  onClose: () => void;
}) => {
  const actions = useModuleActions();
  const [tab, setTab] = useState("configuration");
  const remote = module.remote;
  return (
    <aside aria-label={`${module.title} details`} className={classBase}>
      <PanelHeader module={module} onClose={onClose} />
      <div className={`${classBase}-status`}>
        <EnabledStatus enabled={module.enabled} />
        {remote?.status === "ok" ? (
          <span className={`${classBase}-reachable`}>
            <SuccessCircleIcon aria-hidden /> Reachable from this browser
          </span>
        ) : null}
      </div>
      <div className={`${classBase}-actions`}>
        <Button onClick={() => actions.edit(module)} sentiment="accented">
          <EditIcon aria-hidden /> Edit
        </Button>
        <Button
          appearance="transparent"
          onClick={() => actions.toggleEnabled(module)}
        >
          <VisibleIcon aria-hidden /> {module.enabled ? "Disable" : "Enable"}
        </Button>
        <Button
          appearance="transparent"
          onClick={() => actions.duplicate(module)}
        >
          <CopyIcon aria-hidden /> Duplicate
        </Button>
        <span className={`${classBase}-spacer`} />
        <Button
          appearance="transparent"
          onClick={() => actions.delete(module)}
          sentiment="negative"
        >
          <DeleteIcon aria-hidden /> Delete
        </Button>
      </div>
      <Tabs onChange={(_, value) => setTab(value)} value={tab}>
        <TabBar divider inset>
          <TabList aria-label="Module details">
            <Tab value="configuration">
              <TabTrigger>Configuration</TabTrigger>
            </Tab>
            <Tab value="access">
              <TabTrigger>Access</TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <div className={`${classBase}-body`}>
          <TabPanel value="configuration">
            <ConfigurationTab module={module} />
          </TabPanel>
          <TabPanel value="access">
            <AccessTab module={module} />
          </TabPanel>
        </div>
      </Tabs>
    </aside>
  );
};
