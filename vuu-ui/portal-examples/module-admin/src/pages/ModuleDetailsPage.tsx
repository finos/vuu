import type { ModuleConfig } from "@heswell/module-admin/contracts";
import {
  Banner,
  BannerContent,
  Button,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  Spinner,
  Text,
} from "@salt-ds/core";
import {
  AddIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  HistoryIcon,
  LayersIcon,
  LockedIcon,
  MenuIcon,
  MicroMenuIcon,
  PlayIcon,
  RefreshIcon,
  SignpostIcon,
  StopIcon,
  SuccessCircleIcon,
  TreeIcon,
  UndoIcon,
  WarningIcon,
} from "@salt-ds/icons";
import { PortalLink } from "@vuu-ui/core/portal";
import cx from "clsx";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorCount } from "../components/ErrorCount";
import { useModuleActions } from "../components/ModuleActions";
import {
  AccessRoleField,
  EnabledField,
  FederationFields,
  IdentityFields,
  NavIconPicker,
  NavigationFields,
} from "../components/ModuleForm";
import { RemoteCheckBox } from "../components/RemoteCheckBox";
import {
  EnabledStatus,
  FactList,
  MenuLocation,
  NavIcon,
  RoleTag,
  SectionHeading,
} from "../components/ui";
import {
  FIELD_LABELS,
  type ModuleView,
  formatDate,
  relativeTime,
  toConfig,
} from "../data/module-model";
import { useModuleDraft } from "../data/useModuleDraft";
import { listModules, useModuleAdmin } from "../ModuleAdminContext";

const classBase = "vuuModuleDetails";

const display = (value: ModuleConfig[keyof ModuleConfig]) =>
  value === ""
    ? "–"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : String(value);

/** True once `target` has scrolled out of the top of `root`. */
const useScrolledPast = (
  root: RefObject<HTMLElement | null>,
  target: RefObject<HTMLElement | null>,
) => {
  const [past, setPast] = useState(false);
  useEffect(() => {
    if (!root.current || !target.current) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setPast(
          !entry.isIntersecting &&
            entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
        ),
      { root: root.current },
    );
    observer.observe(target.current);
    return () => observer.disconnect();
  }, [root, target]);
  return past;
};

const Card = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) => (
  <section className={cx(`${classBase}-card`, className)} id={id}>
    {children}
  </section>
);

const RemotePill = ({ module }: { module: ModuleView }) => {
  const status = module.remote?.status;
  if (!status) return null;
  const label =
    status === "ok"
      ? "Reachable from this browser"
      : status === "checking"
        ? "Checking remote…"
        : status === "unreachable"
          ? "Remote unreachable"
          : "Remote mismatch";
  return (
    <span className={cx(`${classBase}-pill`, `${classBase}-pill-${status}`)}>
      {status === "ok" ? (
        <SuccessCircleIcon aria-hidden />
      ) : status === "checking" ? null : (
        <WarningIcon aria-hidden />
      )}
      {label}
    </span>
  );
};

const Breadcrumbs = ({ module }: { module: ModuleView }) => {
  const { listPrefs, paths, views } = useModuleAdmin();
  const navigate = useNavigate();
  const list = useMemo(() => {
    const listed = listModules(views, listPrefs).flatMap(
      ({ modules }) => modules,
    );
    return listed.some(({ id }) => id === module.id) ? listed : views;
  }, [listPrefs, module.id, views]);
  const index = list.findIndex(({ id }) => id === module.id);
  const prev = index > 0 ? list[index - 1] : undefined;
  const next = index < list.length - 1 ? list[index + 1] : undefined;
  const modulesPath = paths.modules(listPrefs.status);

  return (
    <nav aria-label="Breadcrumb" className={`${classBase}-breadcrumbs`}>
      <Button
        appearance="transparent"
        aria-label="Back to modules"
        onClick={() => navigate(modulesPath)}
      >
        <ArrowLeftIcon aria-hidden />
      </Button>
      <PortalLink className={`${classBase}-crumb`} to={modulesPath}>
        Modules
      </PortalLink>
      <ChevronRightIcon aria-hidden className={`${classBase}-crumbSep`} />
      <span aria-current="page" className={`${classBase}-crumbCurrent`}>
        {module.title}
      </span>
      <span className={`${classBase}-spacer`} />
      {index >= 0 ? (
        <span className={`${classBase}-pager`}>
          <Text color="secondary" styleAs="label">
            {index + 1} of {list.length}
          </Text>
          <Button
            appearance="transparent"
            aria-label={prev ? `Previous: ${prev.title}` : "Previous"}
            disabled={!prev}
            onClick={() => prev && navigate(paths.module(prev.name))}
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <Button
            appearance="transparent"
            aria-label={next ? `Next: ${next.title}` : "Next"}
            disabled={!next}
            onClick={() => next && navigate(paths.module(next.name))}
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </span>
      ) : null}
    </nav>
  );
};

const ModuleActionButtons = ({ module }: { module: ModuleView }) => {
  const actions = useModuleActions();
  const canEnable = module.enabled || Boolean(module.effectiveAccessRole);
  return (
    <div className={`${classBase}-actions`}>
      <Button onClick={() => actions.edit(module)} sentiment="accented">
        <EditIcon aria-hidden /> Edit
      </Button>
      <Button
        disabled={!canEnable}
        onClick={() => actions.toggleEnabled(module)}
        title={canEnable ? undefined : "Set an access role before enabling"}
      >
        {module.enabled ? (
          <>
            <StopIcon aria-hidden /> Disable
          </>
        ) : (
          <>
            <PlayIcon aria-hidden /> Enable
          </>
        )}
      </Button>
      <Menu>
        <MenuTrigger>
          <Button appearance="transparent" aria-label="More actions">
            <MicroMenuIcon aria-hidden />
          </Button>
        </MenuTrigger>
        <MenuPanel>
          <MenuItem onClick={() => actions.duplicate(module)}>
            Duplicate
          </MenuItem>
          <MenuItem
            disabled={!module.mfUrl}
            onClick={() => actions.checkRemote(module)}
          >
            Check remote
          </MenuItem>
          <MenuItem onClick={() => actions.delete(module)}>Delete…</MenuItem>
        </MenuPanel>
      </Menu>
    </div>
  );
};

const ModuleHero = ({
  heroRef,
  module,
}: {
  heroRef: RefObject<HTMLDivElement | null>;
  module: ModuleView;
}) => (
  <div className={`${classBase}-hero`} ref={heroRef}>
    <NavIcon name={module.name} size="large" url={module.navIconUrl} />
    <div className={`${classBase}-heroMain`}>
      <h1 className={`${classBase}-title`}>{module.title}</h1>
      <code className={`${classBase}-subtitle`}>
        {module.name} · id {module.id} · version {module.version}
      </code>
      <div className={`${classBase}-pills`}>
        <EnabledStatus enabled={module.enabled} />
        <RemotePill module={module} />
        {module.issues.length > 0 ? (
          <span className={cx(`${classBase}-pill`, `${classBase}-pill-warn`)}>
            <WarningIcon aria-hidden /> {module.issues.length}{" "}
            {module.issues.length === 1 ? "issue" : "issues"}
          </span>
        ) : null}
        <span className={`${classBase}-pill`}>
          {module.parent ? <TreeIcon aria-hidden /> : <MenuIcon aria-hidden />}
          <MenuLocation module={module} />
        </span>
      </div>
      {module.description ? (
        <Text className={`${classBase}-description`}>{module.description}</Text>
      ) : null}
    </div>
    <ModuleActionButtons module={module} />
  </div>
);

const Issues = ({ module }: { module: ModuleView }) => {
  const actions = useModuleActions();
  const { paths } = useModuleAdmin();
  const navigate = useNavigate();
  if (module.issues.length === 0) return null;
  return (
    <ul aria-label="Issues" className={`${classBase}-issues`}>
      {module.issues.map((issue) => (
        <li className={`${classBase}-issue`} key={issue.kind}>
          <WarningIcon aria-hidden />
          <span>{issue.message}</span>
          {issue.kind === "remote" ? (
            <Button
              appearance="bordered"
              disabled={module.remote?.status === "checking"}
              onClick={() => actions.checkRemote(module)}
            >
              <RefreshIcon aria-hidden /> Check remote
            </Button>
          ) : (
            <Button
              appearance="bordered"
              onClick={() => navigate(`${paths.edit(module.name)}#access`)}
            >
              <LockedIcon aria-hidden /> Set access role
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
};

const RelatedModules = ({ module }: { module: ModuleView }) => {
  const { paths } = useModuleAdmin();
  return (
    <Card>
      <SectionHeading icon={<TreeIcon aria-hidden />}>
        Related modules
      </SectionHeading>
      {module.parent ? (
        <div className={`${classBase}-related`}>
          <Text color="secondary" styleAs="label">
            Parent
          </Text>
          <PortalLink to={paths.module(module.parent.name)}>
            {module.parent.title}
          </PortalLink>
        </div>
      ) : null}
      {module.children.length > 0 ? (
        <div className={`${classBase}-related`}>
          <Text color="secondary" styleAs="label">
            Children
          </Text>
          <ul>
            {module.children.map((child) => (
              <li key={child.id}>
                <PortalLink to={paths.module(child.name)}>
                  {child.title}
                </PortalLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {!module.parent && module.children.length === 0 ? (
        <Text color="secondary">No parent or child modules.</Text>
      ) : null}
      {!module.parent ? (
        <PortalLink
          className={`${classBase}-addChild`}
          to={`${paths.newModule()}?parent=${encodeURIComponent(module.name)}`}
        >
          <AddIcon aria-hidden /> Add child module
        </PortalLink>
      ) : null}
    </Card>
  );
};

const ModuleOverview = ({ module }: { module: ModuleView }) => {
  const actions = useModuleActions();
  const { paths } = useModuleAdmin();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const compact = useScrolledPast(pageRef, heroRef);

  return (
    <div className={`vuuModuleAdmin-page ${classBase}`} ref={pageRef}>
      <div className={`${classBase}-compactAnchor`}>
        <div
          aria-hidden={!compact}
          className={cx(`${classBase}-compact`, {
            [`${classBase}-compact-visible`]: compact,
          })}
        >
          <NavIcon name={module.name} size="small" url={module.navIconUrl} />
          <strong>{module.title}</strong>
          <EnabledStatus enabled={module.enabled} />
          <span className={`${classBase}-spacer`} />
          <Button
            onClick={() => actions.edit(module)}
            sentiment="accented"
            tabIndex={compact ? undefined : -1}
          >
            <EditIcon aria-hidden /> Edit
          </Button>
        </div>
      </div>
      <Breadcrumbs module={module} />
      <ModuleHero heroRef={heroRef} module={module} />
      <Issues module={module} />
      <div className={`${classBase}-columns`}>
        <div className={`${classBase}-main`}>
          <Card>
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
              ]}
              variant="panel"
            />
          </Card>
          <Card>
            <div className={`${classBase}-cardHeader`}>
              <SectionHeading icon={<LayersIcon aria-hidden />}>
                Module federation
              </SectionHeading>
              <Text color="secondary" styleAs="label">
                Remote check · advisory, not saved
              </Text>
            </div>
            <FactList
              facts={[
                ["Scope", <code key="s">{module.mfScope}</code>],
                [
                  "Exposed component",
                  <code key="c">./{module.mfComponent}</code>,
                ],
                [
                  "Remote URL",
                  <a
                    href={module.mfUrl}
                    key="u"
                    rel="noreferrer"
                    target="_blank"
                  >
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
          </Card>
        </div>
        <aside aria-label="Module summary" className={`${classBase}-aside`}>
          <Card>
            <SectionHeading icon={<LockedIcon aria-hidden />}>
              Access
            </SectionHeading>
            <RoleTag module={module} />
            <Text color="secondary">
              {module.accessRoleInherited
                ? `Inherited from ${module.parent?.title ?? "parent"}.`
                : module.accessRole
                  ? "Set on this module."
                  : "No user can open this module until it has an access role."}{" "}
              Users see the module when it is enabled and they hold the role.
            </Text>
            {module.effectiveAccessRole ? (
              <PortalLink routeScope="portal" to="/administration/users">
                Manage in User Admin
              </PortalLink>
            ) : (
              <Button
                appearance="bordered"
                onClick={() => navigate(`${paths.edit(module.name)}#access`)}
              >
                <LockedIcon aria-hidden /> Set access role
              </Button>
            )}
          </Card>
          <RelatedModules module={module} />
          <Card>
            <SectionHeading icon={<HistoryIcon aria-hidden />}>
              History
            </SectionHeading>
            <FactList
              facts={[
                ["Updated", relativeTime(module.updated)],
                ["Created", formatDate(module.created)],
                ["Version", String(module.version)],
              ]}
              variant="panel"
            />
          </Card>
        </aside>
      </div>
    </div>
  );
};

const SECTIONS = [
  ["identity", "Identity"],
  ["navigation", "Navigation"],
  ["federation", "Federation"],
  ["access", "Access"],
] as const;

const ModuleEditor = ({ module }: { module: ModuleView }) => {
  const { modules, paths, remoteChecks, setEditing, updateModule } =
    useModuleAdmin();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);
  // The draft is based on the module as it was when editing started.
  const [base] = useState(() => ({
    config: toConfig(module),
    version: module.version,
  }));
  const initial = base.config;
  const draft = useModuleDraft({
    initial,
    mode: "edit",
    moduleId: module.id,
    modules,
  });
  const [saving, setSaving] = useState(false);
  const changedFields = Object.keys(draft.changes) as (keyof ModuleConfig)[];
  const movedOn = module.version !== base.version;
  const props = { draft, mode: "edit" as const, moduleId: module.id, modules };

  useEffect(() => {
    setEditing(draft.dirty);
  }, [draft.dirty, setEditing]);
  useEffect(() => () => setEditing(false), [setEditing]);

  const jumpTo = (id: string) =>
    pageRef.current
      ?.querySelector(`#${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  useEffect(() => {
    if (hash) jumpTo(hash.slice(1));
  }, []);

  const close = () => {
    setEditing(false);
    navigate(paths.module(module.name));
  };

  const save = async () => {
    draft.setSubmitted(true);
    if (draft.errorCount > 0 || !draft.dirty) return;
    setSaving(true);
    const saved = await updateModule(module, draft.changes, base.version);
    setSaving(false);
    if (saved) close();
  };

  return (
    <div
      className={cx(`vuuModuleAdmin-page ${classBase}`, `${classBase}-editing`)}
      ref={pageRef}
    >
      <Breadcrumbs module={module} />
      <div
        className={cx(`${classBase}-compact`, `${classBase}-compact-visible`)}
      >
        <NavIcon name={module.name} size="small" url={module.navIconUrl} />
        <div className={`${classBase}-compactTitles`}>
          <strong>Editing {module.title}</strong>
          <Text color="secondary" styleAs="label">
            {module.name} · version {base.version}
            {draft.dirty ? ` → ${base.version + 1}` : ""}
          </Text>
        </div>
        <span className={`${classBase}-spacer`} />
        <nav aria-label="Jump to section" className={`${classBase}-jump`}>
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => jumpTo(id)} type="button">
              {label}
            </button>
          ))}
        </nav>
      </div>
      {movedOn ? (
        <Banner status="warning">
          <BannerContent>
            This module was changed elsewhere (now version {module.version}).
            Saving will be rejected; discard and edit again to pick up the
            changes.
          </BannerContent>
        </Banner>
      ) : null}
      <div className={`${classBase}-columns`}>
        <div className={cx(`${classBase}-main`, "vuuModuleForm")}>
          <Card id="identity">
            <SectionHeading>Identity</SectionHeading>
            <IdentityFields {...props} />
            <NavIconPicker draft={draft} mode="edit" />
          </Card>
          <Card id="navigation">
            <SectionHeading icon={<SignpostIcon aria-hidden />}>
              Portal navigation
            </SectionHeading>
            <NavigationFields {...props} />
          </Card>
          <Card id="federation">
            <SectionHeading icon={<LayersIcon aria-hidden />}>
              Module federation
            </SectionHeading>
            <FederationFields {...props} remoteChecks={remoteChecks} />
          </Card>
        </div>
        <aside aria-label="Access and changes" className={`${classBase}-aside`}>
          <Card id="access">
            <SectionHeading icon={<LockedIcon aria-hidden />}>
              Access &amp; status
            </SectionHeading>
            <div className="vuuModuleForm">
              <AccessRoleField {...props} />
              <EnabledField draft={draft} mode="edit" />
            </div>
          </Card>
          <Card className={`${classBase}-changes`}>
            <div className={`${classBase}-cardHeader`}>
              <SectionHeading icon={<EditIcon aria-hidden />}>
                Changes
              </SectionHeading>
              {draft.dirty ? (
                <Button appearance="transparent" onClick={draft.reset}>
                  <UndoIcon aria-hidden /> Revert all
                </Button>
              ) : null}
            </div>
            {draft.dirty ? (
              <dl className={`${classBase}-diff`}>
                {changedFields.map((field) => (
                  <div key={field}>
                    <dt>{FIELD_LABELS[field]}</dt>
                    <dd>
                      <del>{display(initial[field])}</del>
                      <ins>{display(draft.config[field])}</ins>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Text color="secondary">No changes yet.</Text>
            )}
          </Card>
        </aside>
      </div>
      <footer className={`${classBase}-saveBar`}>
        <Text>
          {draft.dirty ? (
            <>
              <strong>
                {changedFields.length} unsaved{" "}
                {changedFields.length === 1 ? "change" : "changes"}
              </strong>{" "}
              · Saving creates version {base.version + 1}
            </>
          ) : (
            "No unsaved changes"
          )}
        </Text>
        <ErrorCount
          count={draft.submitted || draft.dirty ? draft.errorCount : 0}
        />
        <span className={`${classBase}-spacer`} />
        <Button appearance="transparent" onClick={close}>
          {draft.dirty ? "Discard" : "Cancel"}
        </Button>
        <Button
          disabled={!draft.dirty || saving || movedOn}
          onClick={save}
          sentiment="accented"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </footer>
    </div>
  );
};

export const ModuleDetailsPage = ({ editing }: { editing?: boolean }) => {
  const { loading, paths, views } = useModuleAdmin();
  const { name } = useParams();
  const module = views.find((view) => view.name === name);

  if (!module) {
    return loading ? (
      <div className="vuuModuleAdmin-loading">
        <Spinner aria-label="Loading module" />
      </div>
    ) : (
      <div className="vuuModuleAdmin-page">
        <div className="vuuModuleAdmin-notFound">
          <h1>Module not found</h1>
          <Text color="secondary">
            There is no module named <code>{name}</code>. It may have been
            deleted or renamed.
          </Text>
          <PortalLink to={paths.modules()}>Back to modules</PortalLink>
        </div>
      </div>
    );
  }

  return editing ? (
    <ModuleEditor key={module.id} module={module} />
  ) : (
    <ModuleOverview key={module.id} module={module} />
  );
};
