import {
  UserSettingsPanel,
  ApplicationProvider,
  SettingsSchema,
  StaticPersistenceManager,
  PersistenceProvider,
} from "@finos/vuu-shell";

import { useMemo } from "react";
import { scrollableSettingsFormSchema } from "./UserSettingsSchemaExamples/scrollableSettingsSchemaExample"

let displaySequence = 1;

// Showcase example showing the current default settings form
export const DefaultUserSettingsForm = () => {
  const userSettingsSchema: SettingsSchema = {
    properties: [
      {
        name: "themeMode",
        label: "Mode",
        values: ["light", "dark"],
        defaultValue: "light",
        type: "string",
      },
    ],
  };

  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          userSettings: {
            themeMode: "light",
          },
        },
      }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <ApplicationProvider userSettingsSchema={userSettingsSchema}>
        <UserSettingsPanel />
      </ApplicationProvider>
    </PersistenceProvider>
  );
};
DefaultUserSettingsForm.displaySequence = displaySequence++;

// Showcase example showing different form controls
export const VariedFormControlUserSettingsForm = () => {
  const userSettingsSchema: SettingsSchema = {
    properties: [
      {
        name: "themeMode",
        label: "Mode",
        values: ["light", "dark"],
        defaultValue: "light",
        type: "string",
      },
      {
        name: "dateFormatPattern",
        label: "Date Formatting",
        values: ["dd/mm/yyyy", "mm/dd/yyyy", "dd MMMM yyyy"],
        defaultValue: "dd/mm/yyyy",
        type: "string",
      },
      {
        name: "region",
        label: "Region",
        values: [
          { value: "us", label: "US" },
          { value: "apac", label: "Asia Pacific" },
          { value: "emea", label: "Europe, Middle East & Africa" },
        ],
        defaultValue: "apac",
        type: "string",
      },
      {
        name: "greyscale",
        label: "Greyscale",
        defaultValue: false,
        type: "boolean",
      },
    ],
  };

  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          userSettings: {
            themeMode: "light",
            dateFormatPattern: "dd/mm/yyyy",
            region: "US",
            greyscale: false,
          },
        },
      }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <ApplicationProvider userSettingsSchema={userSettingsSchema}>
        <UserSettingsPanel />
      </ApplicationProvider>
    </PersistenceProvider>
  );
};
VariedFormControlUserSettingsForm.displaySequence = displaySequence++;

// Showcase example showing input validations
export const InputValidationUserSettingsForm = () => {
  const userSettingsSchema: SettingsSchema = {
    properties: [
      {
        name: "userName",
        label: "User Name",
        type: "string",
      },
      {
        name: "id",
        label: "Identification Number",
        type: "number",
      },
    ],
  };

  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          userSettings: {
            userName: "",
            id: "",
          },
        },
      }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <ApplicationProvider userSettingsSchema={userSettingsSchema}>
        <UserSettingsPanel />
      </ApplicationProvider>
    </PersistenceProvider>
  );
};
InputValidationUserSettingsForm.displaySequence = displaySequence++;

// Showcase example showing large quantity of form controls
export const ScrollableUserSettingsPanel = () => {
  
  const demoPersistenceManager = useMemo(
    () =>
      new StaticPersistenceManager({
        applicationJSON: {
          userSettings: {
            themeMode: "light",
            dateFormatPattern: "dd/mm/yyyy",
            region: "US",
            greyscale: false,
            userName: ""
          },
        },
      }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <ApplicationProvider userSettingsSchema={scrollableSettingsFormSchema}>
        <UserSettingsPanel />
      </ApplicationProvider>
    </PersistenceProvider>
  );
};
ScrollableUserSettingsPanel.displaySequence = displaySequence++;
