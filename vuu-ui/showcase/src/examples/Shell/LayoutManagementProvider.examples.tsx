import {
  defaultLayoutJson,
  PersistenceProvider,
  Shell,
  StaticPersistenceManager,
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
  const defaultLayout = useMemo(
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
      <Shell defaultLayout={defaultLayout} user={user}></Shell>
    </PersistenceProvider>
  );
};
CustomDefaultLayoutNoStoredState.displaySequence = displaySequence++;

export const DefaultLayoutStoredState = () => {
  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          layout: {
            ...defaultLayoutJson,
            children: [
              {
                type: "div",
                props: {
                  title: "Blue",
                  style: { backgroundColor: "red", height: "100%" },
                },
              },
              {
                type: "div",
                props: {
                  title: "Red",
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
      <Shell user={user}></Shell>
    </PersistenceProvider>
  );
};
DefaultLayoutStoredState.displaySequence = displaySequence++;

export const CustomLayoutStoredState = () => {
  const defaultLayout = useMemo(
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
          layout: {
            ...defaultLayoutJson,
            props: {
              ...defaultLayoutJson.props,
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
      <Shell defaultLayout={defaultLayout} user={user}></Shell>
    </PersistenceProvider>
  );
};
CustomLayoutStoredState.displaySequence = displaySequence++;
