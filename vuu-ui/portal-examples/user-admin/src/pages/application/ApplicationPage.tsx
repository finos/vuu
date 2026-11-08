import {
  Badge,
  Banner,
  BannerContent,
  Code,
  H2,
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Text,
} from "@salt-ds/core";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AdminLink,
  AppAvatar,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingText,
  PanelHeadingTitle,
  plural,
} from "../../components/admin-ui/AdminUi";
import { useUserCount } from "../../components/userCount";
import { IssueList } from "../../components/IssueList";
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
const TABS: readonly ApplicationTab[] = ["users", "groups"];

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
  const tab = param && TABS.includes(param) ? param : "users";
  const [panelOpen, setPanelOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const users = useUserCount(application.accessRole);
  const memberships = useApplicationMemberships(entry);

  const setTab = (value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === "users") next.delete("tab");
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
            <AdminLink to={paths.overview}>Overview</AdminLink>
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
          </header>

          {entry.issues.length > 0 ? (
            <Banner status="warning">
              <BannerContent>
                <details>
                  <summary>
                    {plural(entry.issues.length, "configuration issue")}
                  </summary>
                  <IssueList issues={entry.issues} />
                </details>
              </BannerContent>
            </Banner>
          ) : null}

          <Tabs onChange={(_event, value) => setTab(value)} value={tab}>
            <TabBar divider>
              <TabList
                appearance="transparent"
                aria-label={`${application.title} sections`}
              >
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
                <Tab value="groups">
                  <TabTrigger>Groups &amp; roles</TabTrigger>
                </Tab>
              </TabList>
            </TabBar>
            <TabPanel value="users">
              <ApplicationUsersTab
                entry={entry}
                memberships={memberships.memberships}
                membershipsError={memberships.error}
                onManageUsers={() => setGrantOpen(true)}
              />
            </TabPanel>
            <TabPanel value="groups">
              <GroupsRolesTab
                entry={entry}
                onNewGroup={() => setPanelOpen(true)}
              />
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
          <AdminLink to={paths.overview}>Return to Overview</AdminLink>
        </p>
      )}
    </section>
  );
};
