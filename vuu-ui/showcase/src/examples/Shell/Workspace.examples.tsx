import {
  PersistenceProvider,
  Shell,
  StaticPersistenceManager,
  stackWorkspaceJSON,
} from "@finos/vuu-shell";
import { useMemo } from "react";

let displaySequence = 1;

const user = { username: "why-the-lucky-stiff", token: "test-token" };

export const DefaultLayoutNoStoredState = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({}),
    []
  );
  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <Shell user={user}></Shell>
    </PersistenceProvider>
  );
};
DefaultLayoutNoStoredState.displaySequence = displaySequence++;

export const DefaultLayoutNoStoredStateLoadDelay = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({ applicationLoadDelay: 5000 }),
    []
  );
  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <Shell user={user}></Shell>
    </PersistenceProvider>
  );
};
DefaultLayoutNoStoredStateLoadDelay.displaySequence = displaySequence++;

export const CustomDefaultLayoutNoStoredState = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({}),
    []
  );
  const layoutJSON = useMemo(
    () => ({
      type: "div",
      props: {
        style: { backgroundColor: "yellow", height: "100%" },
      },
    }),
    []
  );
  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <Shell workspaceProps={{ layoutJSON }} user={user}></Shell>
    </PersistenceProvider>
  );
};
CustomDefaultLayoutNoStoredState.displaySequence = displaySequence++;

export const DefaultLayoutStoredState = () => {
  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          workspaceJSON: {
            ...stackWorkspaceJSON,
            children: [
              {
                type: "div",
                props: {
                  title: "Blue",
                  style: { backgroundColor: "blue", height: "100%" },
                },
              },
              {
                type: "div",
                props: {
                  title: "Red",
                  style: { backgroundColor: "red", height: "100%" },
                },
              },
            ],
          },
        },
      }),
    []
  );
  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <Shell user={user}></Shell>
    </PersistenceProvider>
  );
};
DefaultLayoutStoredState.displaySequence = displaySequence++;

export const CustomLayoutStoredState = () => {
  const layoutJSON = useMemo(
    () => ({
      type: "div",
      props: {
        style: { backgroundColor: "yellow", height: "100%" },
      },
    }),
    []
  );

  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          workspaceJSON: {
            ...stackWorkspaceJSON,
            props: {
              ...stackWorkspaceJSON.props,
              active: 1,
            },
            children: [
              {
                type: "div",
                props: {
                  title: "Red",
                  style: { backgroundColor: "red", height: "100%" },
                },
              },
              {
                type: "div",
                props: {
                  title: "Blue",
                  style: { backgroundColor: "blue", height: "100%" },
                },
              },
            ],
          },
        },
      }),
    []
  );
  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <Shell workspaceProps={{ layoutJSON }} user={user}></Shell>
    </PersistenceProvider>
  );
};
CustomLayoutStoredState.displaySequence = displaySequence++;
