import {
  Badge,
  Banner,
  BannerContent,
  Button,
  Code,
  H2,
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  StatusIndicator,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Text,
} from "@salt-ds/core";
import { AddUserIcon } from "@salt-ds/icons";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AdminLink,
  AppAvatar,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingText,
  PanelHeadingTitle,
} from "../../components/admin-ui/AdminUi";
import { useUserCount } from "../../components/ApplicationCard";
import { IssueList } from "../../components/IssueList";
import { PORTAL_CLIENT_IDENTIFIER } from "../../data/applications";
import type { ApplicationDetails } from "../../data/applications";
import { type ApplicationTab, useAdminPaths } from "../../data/useAdminPaths";
import { useApplicationModel } from "../../data/useApplicationModel";
import { useApplicationMemberships } from "../../data/useApplicationUsers";
import { ApplicationUsersTab } from "./ApplicationUsersTab";
import { GrantAccessDialog } from "./GrantAccessDialog";
import { GroupsRolesTab } from "./GroupsRolesTab";
import { NewGroupPanel } from "./NewGroupPanel";

import "./ApplicationPage.css";

const classBase = "vuuAdminApplication";
const TABS: readonly ApplicationTab[] = ["groups", "users", "checks"];

const Fact = ({ label, value }: { label: string; value: string }) => (
  <span className={`${classBase}-fact`}>
    <Text color="secondary" styleAs="label">
      {label}
    </Text>
    <Code>{value}</Code>
  </span>
);

const ApplicationWorkspace = ({ entry }: { entry: ApplicationDetails }) => {
  const { application } = entry;
  const paths = useAdminPaths();
  const [params, setParams] = useSearchParams();
  const param = params.get("tab") as ApplicationTab | null;
  const tab = param && TABS.includes(param) ? param : "groups";
  const [panelOpen, setPanelOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const users = useUserCount(application.accessRole);
  const memberships = useApplicationMemberships(entry);

  const setTab = (value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === "groups") next.delete("tab");
        else next.set("tab", value);
        return next;
      },
      { replace: true },
    );

  return (
    <SidePanelProvider open={panelOpen} onOpenChange={setPanelOpen}>
      <div className="vuuIdentityAdmin-pageWithPanel">
        <section
          aria-label={application.title}
          className={`vuuIdentityAdmin-page ${classBase}`}
        >
          <nav aria-label="Breadcrumb" className={`${classBase}-breadcrumb`}>
            <AdminLink to={paths.applications}>Applications</AdminLink>
            <Text color="secondary"> / {application.title}</Text>
          </nav>
          <header className={`${classBase}-header`}>
            <AppAvatar application={application} size={2.5} />
            <div className="vuuAdminUi-stack">
              <H2>{application.title}</H2>
              {application.description ? (
                <Text color="secondary">{application.description}</Text>
              ) : null}
              <div className={`${classBase}-facts`}>
                <Fact label="Client" value={application.clientIdentifier} />
                <Fact label="Access role" value={application.accessRole} />
                <Fact
                  label="Group prefix"
                  value={`${application.groupPrefix}*`}
                />
              </div>
            </div>
            <Button onClick={() => setGrantOpen(true)} sentiment="accented">
              <AddUserIcon aria-hidden /> Grant access
            </Button>
          </header>

          <Tabs onChange={(_event, value) => setTab(value)} value={tab}>
            <TabBar divider>
              <TabList aria-label={`${application.title} sections`}>
                <Tab value="groups">
                  <TabTrigger>Groups &amp; roles</TabTrigger>
                </Tab>
                <Tab value="users">
                  <TabTrigger>
                    Users
                    {users.count !== undefined ? (
                      <Badge
                        aria-label={`${users.count}`}
                        value={users.count}
                      />
                    ) : null}
                  </TabTrigger>
                </Tab>
                <Tab value="checks">
                  <TabTrigger>
                    Checks
                    {entry.issues.length > 0 ? (
                      <Badge
                        aria-label={`${entry.issues.length} issues`}
                        value={entry.issues.length}
                      />
                    ) : (
                      <StatusIndicator status="success" />
                    )}
                  </TabTrigger>
                </Tab>
              </TabList>
            </TabBar>
            <TabPanel value="groups">
              <GroupsRolesTab
                entry={entry}
                onNewGroup={() => setPanelOpen(true)}
              />
            </TabPanel>
            <TabPanel value="users">
              <ApplicationUsersTab
                entry={entry}
                memberships={memberships.memberships}
                membershipsError={memberships.error}
              />
            </TabPanel>
            <TabPanel value="checks">
              <div className={`${classBase}-tab`}>
                <Text color="secondary">
                  {application.title} uses access role{" "}
                  <Code>{application.accessRole}</Code> on{" "}
                  {PORTAL_CLIENT_IDENTIFIER}, roles on{" "}
                  <Code>{application.clientIdentifier}</Code>, and groups named{" "}
                  <Code>{application.groupPrefix}*</Code>.
                </Text>
                <IssueList issues={entry.issues} />
              </div>
            </TabPanel>
          </Tabs>
        </section>
        <SidePanel className="vuuIdentityAdmin-panel" position="right">
          <SidePanelHeader>
            <PanelHeading>
              <AppAvatar application={application} size={2} />
              <PanelHeadingText>
                <PanelHeadingTitle>New group</PanelHeadingTitle>
                <PanelHeadingSubtitle>
                  in {application.title}
                </PanelHeadingSubtitle>
              </PanelHeadingText>
            </PanelHeading>
            <SidePanelCloseButton />
          </SidePanelHeader>
          <SidePanelContent>
            {panelOpen ? (
              <NewGroupPanel
                entry={entry}
                onClose={() => setPanelOpen(false)}
              />
            ) : null}
          </SidePanelContent>
        </SidePanel>
      </div>
      <GrantAccessDialog
        entry={entry}
        memberships={memberships.memberships}
        onOpenChange={setGrantOpen}
        open={grantOpen}
      />
    </SidePanelProvider>
  );
};

/** One application: its groups and roles, who can open it, and its checks. */
export const ApplicationPage = ({ name }: { name: string }) => {
  const { error, loading, model } = useApplicationModel();
  const paths = useAdminPaths();
  const entry = model.byName.get(name);
  if (entry) return <ApplicationWorkspace entry={entry} />;
  return (
    <section className="vuuIdentityAdmin-page">
      {error ? (
        <Banner status="error">
          <BannerContent role="alert">{error}</BannerContent>
        </Banner>
      ) : loading ? (
        <p role="status">Loading application...</p>
      ) : (
        <p>
          No application named "{name}" is registered with the portal.{" "}
          <AdminLink to={paths.applications}>All applications</AdminLink>
        </p>
      )}
    </section>
  );
};
