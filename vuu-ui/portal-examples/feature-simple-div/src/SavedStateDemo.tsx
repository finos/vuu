import { Button, FormField, FormFieldLabel, Input, Text } from "@salt-ds/core";
import {
  type StateMigration,
  useOptionalApplicationState,
  usePersistedState,
  useSavedStateDialog,
} from "@vuu-ui/core/portal";
import { useState } from "react";

const COUNT_KEY = "demo/count";
const NOTE_KEY = "demo/note";
const countMetadata = { label: "Click count", group: "Demo" };
const noteMetadata = { label: "Note", group: "Demo" };

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
 * Keeps a click count and a note in component state, initialised from saved
 * state with `load` and saved with `save` whenever they change. Outside a
 * portal nothing is saved.
 */
export const SavedStateDemo = () => {
  const store = useOptionalApplicationState();
  const savedState = useSavedStateDialog();
  const { load, save } = usePersistedState();
  const [count, setCountState] = useState(() => load<number>(COUNT_KEY) ?? 0);
  const [note, setNoteState] = useState(() => load<string>(NOTE_KEY) ?? "");

  const setCount = (value: number) => {
    setCountState(value);
    save(value, COUNT_KEY, countMetadata);
  };
  const setNote = (value: string) => {
    setNoteState(value);
    save(value, NOTE_KEY, noteMetadata);
  };

  return (
    <div className="vuuSavedStateDemo">
      <Text styleAs="h3">Saved state demo</Text>
      <Text>
        {store
          ? `These values are saved for ${store.applicationKey}, version ${store.applicationVersion}.`
          : "Outside a portal, these values last only until the page reloads."}
      </Text>
      <div className="vuuSavedStateDemo-row">
        <Button onClick={() => setCount(count + 1)}>
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
