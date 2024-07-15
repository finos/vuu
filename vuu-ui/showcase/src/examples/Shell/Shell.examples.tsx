import {
  Shell,
  LocalPersistenceManager,
  PersistenceProvider,
} from "@finos/vuu-shell";
import { CSSProperties, useMemo } from "react";

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const DefaultShell = () => {
  const localPersistenceManager = useMemo(
    () => new LocalPersistenceManager(`vuu/${user.username}`),
    []
  );

  return (
    <PersistenceProvider persistenceManager={localPersistenceManager}>
      <Shell
        loginUrl={window.location.toString()}
        user={user}
        style={
          {
            "--vuuShell-height": "100%",
            "--vuuShell-width": "100%",
          } as CSSProperties
        }
      ></Shell>
    </PersistenceProvider>
  );
};

DefaultShell.displaySequence = displaySequence++;

export const ShellWithFullHeightLayout = () => {
  const localPersistenceManager = useMemo(
    () => new LocalPersistenceManager(`vuu/${user.username}`),
    []
  );

  return (
    <PersistenceProvider persistenceManager={localPersistenceManager}>
      <Shell
        LeftSidePanelProps={{
          children: <div className="My Left Side">My left Side</div>,
          sizeOpen: 200,
        }}
        leftSidePanelLayout="full-height"
        loginUrl={window.location.toString()}
        user={user}
        style={
          {
            "--vuuShell-height": "100%",
            "--vuuShell-width": "100%",
          } as CSSProperties
        }
      />
    </PersistenceProvider>
  );
};

ShellWithFullHeightLayout.displaySequence = displaySequence++;

export const ShellWithFullHeightLayoutLeftPanelClosed = () => {
  const localPersistenceManager = useMemo(
    () => new LocalPersistenceManager(`vuu/${user.username}`),
    []
  );
  return (
    <PersistenceProvider persistenceManager={localPersistenceManager}>
      <Shell
        LeftSidePanelProps={{
          children: <div className="My Left Side">My left Side</div>,
          open: false,
          sizeOpen: 200,
          sizeClosed: 60,
        }}
        leftSidePanelLayout="full-height"
        loginUrl={window.location.toString()}
        user={user}
        style={
          {
            "--vuuShell-height": "100%",
            "--vuuShell-width": "100%",
          } as CSSProperties
        }
      />
    </PersistenceProvider>
  );
};

ShellWithFullHeightLayoutLeftPanelClosed.displaySequence = displaySequence++;
