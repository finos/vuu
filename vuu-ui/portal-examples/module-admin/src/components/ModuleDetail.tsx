import {
  Banner,
  BannerContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { PortalLink } from "@vuu-ui/core/portal";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import type { SyntheticEvent } from "react";
import {
  type ModuleView,
  formatDate,
  moduleSourceYaml,
  relativeTime,
} from "../data/module-model";
import { type DetailView, useModuleAdmin } from "../ModuleAdminContext";
import { CONFIG_FILE, configUrl } from "../data/remote-check";
import { RemoteCheckBox } from "./RemoteCheckBox";
import {
  type Fact,
  FactList,
  MenuLocation,
  NavIcon,
  RoleTag,
  Section,
  SourceTag,
  StatusPill,
} from "./ui";

const MODULES_FILE = "modules.yaml";

const classBase = "vuuModuleDetail";

/** User Admin's route in the portal. */
export const USER_ADMIN_PATH = "/administration/users";

const useCopyConfig = () => {
  const { showNotification } = useNotifications();
  return async (module: ModuleView) => {
    try {
      await navigator.clipboard.writeText(moduleSourceYaml(module));
      showNotification({
        content: "",
        header: `${module.title} config copied`,
        status: "success",
        type: NotificationType.Toast,
      });
    } catch {
      showNotification({
        content: "The browser did not allow access to the clipboard.",
        header: "Could not copy the config",
        status: "error",
        type: NotificationType.Toast,
      });
    }
  };
};

const DetailHeader = ({
  backTo,
  module,
}: {
  backTo?: string;
  module: ModuleView;
}) => {
  const { detailView, setDetailView } = useModuleAdmin();
  const copyConfig = useCopyConfig();
  const issues = module.issues.length;
  return (
    <header className={`${classBase}-header`}>
      {backTo ? (
        <PortalLink
          aria-label="Back to modules"
          className={`${classBase}-back`}
          to={backTo}
        >
          <Icon name="arrow-left" />
        </PortalLink>
      ) : null}
      <NavIcon name={module.name} url={module.navIconUrl} />
      <div className={`${classBase}-heading`}>
        <h2>
          {module.title}
          {module.enabled ? (
            <StatusPill icon="module-power" tone="positive">
              Enabled
            </StatusPill>
          ) : (
            <StatusPill icon="module-power" tone="neutral">
              Disabled
            </StatusPill>
          )}
          {issues > 0 ? (
            <StatusPill icon="warn-triangle" tone="warning">
              {issues} issue{issues > 1 ? "s" : ""}
            </StatusPill>
          ) : null}
        </h2>
        <code className={`${classBase}-identity`}>
          {module.name} · id {module.id} · v{module.version}
        </code>
      </div>
      <div className={`${classBase}-actions`}>
        <ToggleButtonGroup
          aria-label="Show config as"
          className={`${classBase}-viewToggle`}
          onChange={(event: SyntheticEvent<HTMLButtonElement>) =>
            setDetailView(event.currentTarget.value as DetailView)
          }
          value={detailView}
        >
          <ToggleButton value="fields">Fields</ToggleButton>
          <ToggleButton value="yaml">YAML</ToggleButton>
        </ToggleButtonGroup>
        <Button
          appearance="transparent"
          aria-label="Copy config"
          onClick={() => void copyConfig(module)}
          title="Copy config as YAML"
        >
          <Icon name="module-copy" />
        </Button>
        {module.path ? (
          <PortalLink
            aria-label={`Open ${module.title}`}
            className={`${classBase}-open`}
            routeScope="portal"
            title="Open in the portal"
            to={module.path}
          >
            <Icon name="open-in" />
          </PortalLink>
        ) : null}
      </div>
    </header>
  );
};

const Issues = ({ module }: { module: ModuleView }) =>
  module.issues.length > 0 ? (
    <div className={`${classBase}-issues`}>
      {module.issues.map((issue) => (
        <Banner
          key={issue.kind}
          status={issue.kind === "remote" ? "error" : "warning"}
        >
          <BannerContent>
            <strong>{issue.message}</strong>
            {issue.detail ? (
              <span className={`${classBase}-issueDetail`}>{issue.detail}</span>
            ) : null}
          </BannerContent>
        </Banner>
      ))}
    </div>
  ) : null;

const ModuleLink = ({
  module,
}: {
  module: { name: string; title: string };
}) => {
  const { paths } = useModuleAdmin();
  return (
    <PortalLink className={`${classBase}-link`} to={paths.module(module.name)}>
      {module.title}
    </PortalLink>
  );
};

const ConfigFields = ({ module }: { module: ModuleView }) => {
  const { remoteChecks } = useModuleAdmin();
  const role = module.effectiveAccessRole;
  return (
    <div className={`${classBase}-sections`}>
      <Section
        icon="module-signpost"
        note={<SourceTag file={MODULES_FILE} />}
        title="Portal navigation"
      >
        <FactList
          facts={[
            ["Menu location", <MenuLocation key="m" module={module} />],
            [
              "Route",
              module.path ? (
                <code key="r">{module.path}</code>
              ) : (
                <span className="vuuModuleAdmin-muted" key="r">
                  None
                </span>
              ),
            ],
            [
              "Icon",
              module.navIconUrl ? (
                <NavIcon
                  key="i"
                  name={module.name}
                  size="small"
                  url={module.navIconUrl}
                />
              ) : (
                <span className="vuuModuleAdmin-muted" key="i">
                  Default
                </span>
              ),
            ],
            [
              "Parent",
              module.parent ? (
                <ModuleLink key="p" module={module.parent} />
              ) : (
                <span className="vuuModuleAdmin-muted" key="p">
                  None, top-level entry
                </span>
              ),
            ],
            ...(module.children.length > 0
              ? [
                  [
                    "Children",
                    <span className={`${classBase}-children`} key="c">
                      {module.children.map((child) => (
                        <ModuleLink key={child.id} module={child} />
                      ))}
                    </span>,
                  ] as Fact,
                ]
              : []),
          ]}
        />
      </Section>
      <Section
        icon="box"
        note={<SourceTag file={MODULES_FILE} />}
        title="Module federation"
      >
        <FactList
          facts={[
            [
              "Remote URL",
              <a
                className={`${classBase}-link`}
                href={module.mfUrl}
                key="u"
                rel="noreferrer"
                target="_blank"
              >
                <code>{module.mfUrl}</code>
              </a>,
            ],
            ["Scope", <code key="s">{module.mfScope}</code>],
            ["Component", <code key="c">./{module.mfComponent}</code>],
          ]}
        />
        <RemoteCheckBox
          module={module}
          onRecheck={() => void remoteChecks.check([module.mfUrl])}
        />
      </Section>
      <RemoteConfig module={module} />
      <Section
        icon="module-lock"
        note={<SourceTag file={MODULES_FILE} />}
        title="Access"
      >
        {role ? (
          <RoleTag className={`${classBase}-accessRole`} role={role} />
        ) : (
          <span className="vuuModuleAdmin-muted">No access role</span>
        )}
        {role ? (
          <PortalLink
            className={`${classBase}-link`}
            routeScope="portal"
            to={USER_ADMIN_PATH}
          >
            Open in User Admin <Icon name="open-in" />
          </PortalLink>
        ) : null}
      </Section>
      <Section
        icon="history"
        note={<SourceTag file={MODULES_FILE} />}
        title="History"
      >
        <FactList
          facts={[
            ["Version", String(module.version)],
            [
              "Updated",
              module.updated ? (
                <span key="u" title={new Date(module.updated).toLocaleString()}>
                  {relativeTime(module.updated)}
                </span>
              ) : (
                "–"
              ),
            ],
            ["Created", formatDate(module.created)],
          ]}
        />
      </Section>
    </div>
  );
};

/**
 * What the remote publishes in its config.json, read from the remote by this
 * browser: not part of the module config.
 */
const RemoteConfig = ({ module }: { module: ModuleView }) => {
  const check = module.remote;
  const config = check?.config;
  const url = module.mfUrl ? configUrl(module.mfUrl) : "";
  return (
    <Section
      icon="settings"
      note={<SourceTag file={CONFIG_FILE} />}
      title="Remote config"
    >
      {config?.status === "loaded" ? (
        config.vuu ? (
          <FactList
            facts={[
              ["Vuu server", <code key="c">{config.vuu.connectionId}</code>],
              ...(config.vuu.websocketUrl
                ? [
                    [
                      "WebSocket URL",
                      <code key="w">{config.vuu.websocketUrl}</code>,
                    ] as Fact,
                  ]
                : []),
              ...(config.vuu.restUrl
                ? [
                    [
                      "Auth (REST) URL",
                      <code key="r">{config.vuu.restUrl}</code>,
                    ] as Fact,
                  ]
                : []),
            ]}
          />
        ) : (
          <FactList
            facts={[["Vuu server", "Uses the portal's Vuu connection"]]}
          />
        )
      ) : (
        <p className={`${classBase}-remoteConfigMessage`}>
          {config?.status === "invalid"
            ? `Not valid: ${config.error}`
            : check?.status === "checking"
              ? `Reading ${CONFIG_FILE} from the remote…`
              : check?.status === "unreachable"
                ? `Not read: the remote isn't reachable from this browser.`
                : "Not read yet."}
        </p>
      )}
      {url ? (
        <p className={`${classBase}-remoteConfigSource`}>
          Published at{" "}
          <a
            className={`${classBase}-link`}
            href={url}
            rel="noreferrer"
            target="_blank"
          >
            <code>{url}</code>
          </a>
        </p>
      ) : null}
    </Section>
  );
};

const ConfigSource = ({ module }: { module: ModuleView }) => {
  const lines = moduleSourceYaml(module).split("\n");
  return (
    <div className={`${classBase}-sourceView`}>
      <p className={`${classBase}-sourceCaption`}>
        <SourceTag file={MODULES_FILE} />
        <span>entry</span>
      </p>
      <section aria-label="Config as YAML" className={`${classBase}-source`}>
        <pre>
          {lines.map((line, index) => (
            // Lines have no identity of their own; their position is their key.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            <span className={`${classBase}-line`} key={index}>
              {line}
            </span>
          ))}
        </pre>
      </section>
    </div>
  );
};

/** The config of one module, read-only. The pane scrolls; its header sticks. */
export const ModuleDetail = ({
  backTo,
  module,
}: {
  backTo?: string;
  module: ModuleView;
}) => {
  const { detailView } = useModuleAdmin();
  return (
    <article aria-label={module.title} className={classBase}>
      <DetailHeader backTo={backTo} module={module} />
      {detailView === "yaml" ? (
        <ConfigSource module={module} />
      ) : (
        <>
          {module.description ? (
            <p className={`${classBase}-description`}>{module.description}</p>
          ) : null}
          <Issues module={module} />
          <ConfigFields module={module} />
        </>
      )}
    </article>
  );
};
