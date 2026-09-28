import { Button, FormField, FormFieldLabel, Input, Text } from "@salt-ds/core";
import {
  type StateMigration,
  useOptionalApplicationState,
  usePersistentState,
  useSavedStateDialog,
} from "@vuu-ui/core/portal";

/**
 * Carries a note saved by version 1 forward to version 2, trimming it.
 * Exported from the remote as `stateMigrations` (see SimpleDiv.tsx).
 */
export const stateMigrations: StateMigration[] = [
  {
    version: 2,
    description: "Trim the saved note",
    migrate: (state) =>
      state.update<string>("demo/note", (note) => note.trim()),
  },
];

/**
 * Saves a click count and a note with usePersistentState. Outside a portal
 * they behave like ordinary component state.
 */
export const SavedStateDemo = () => {
  const store = useOptionalApplicationState();
  const savedState = useSavedStateDialog();
  const [count, setCount] = usePersistentState("demo/count", 0, {
    label: "Click count",
    group: "Demo",
  });
  const [note, setNote] = usePersistentState("demo/note", "", {
    label: "Note",
    group: "Demo",
  });

  return (
    <div className="vuuSavedStateDemo">
      <Text styleAs="h3">Saved state demo</Text>
      <Text>
        {store
          ? `These values are saved for ${store.applicationKey}, version ${store.applicationVersion}.`
          : "Outside a portal, these values last only until the page reloads."}
      </Text>
      <div className="vuuSavedStateDemo-row">
        <Button onClick={() => setCount((value) => value + 1)}>
          Clicked {count} times
        </Button>
        <Button appearance="transparent" onClick={() => setCount(0)}>
          Reset
        </Button>
      </div>
      <FormField>
        <FormFieldLabel>Note</FormFieldLabel>
        <Input
          onChange={(event) =>
            setNote((event.target as HTMLInputElement).value)
          }
          value={note}
        />
      </FormField>
      {savedState.available ? (
        <Button appearance="bordered" onClick={() => savedState.open()}>
          Open Saved state…
        </Button>
      ) : null}
    </div>
  );
};
