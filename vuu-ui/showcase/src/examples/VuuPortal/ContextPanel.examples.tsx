import { Button, FormField, FormFieldLabel, Input, Text } from "@salt-ds/core";
import { useContextPanel, useHideContextPanel } from "@vuu-ui/core";
import { type ChangeEvent, useCallback, useState } from "react";

const GreetingEditor = ({
  initialValue,
  onChange,
}: {
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  const hideContextPanel = useHideContextPanel();
  const [value, setValue] = useState(initialValue);
  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      setValue(evt.target.value);
      onChange(evt.target.value);
    },
    [onChange],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FormField>
        <FormFieldLabel>Greeting</FormFieldLabel>
        <Input inputProps={{ onChange: handleChange }} value={value} />
      </FormField>
      <Button onClick={hideContextPanel}>Done</Button>
    </div>
  );
};

const ContextPanelDemo = ({ placement }: { placement: string }) => {
  const showContextPanel = useContextPanel();
  const [greeting, setGreeting] = useState("Hello from a remote module");

  const editGreeting = useCallback(() => {
    showContextPanel(
      <GreetingEditor initialValue={greeting} onChange={setGreeting} />,
      "Edit greeting",
    );
  }, [greeting, showContextPanel]);

  return (
    <div
      style={{
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
      }}
    >
      <Text styleAs="h2">{greeting}</Text>
      <Text>
        The context panel opens in the {placement}. Use the Portal / Component
        toggle to host this example in a portal; without one there is no context
        panel to open.
      </Text>
      <Button onClick={editGreeting}>Edit greeting</Button>
    </div>
  );
};

/** tags=remote-module */
export const ShellPlacement = () => (
  <ContextPanelDemo placement="portal shell, at the right of the page" />
);

/** tags=remote-module contextPanelPlacement=module */
export const ModulePlacement = () => (
  <ContextPanelDemo placement="module's own frame" />
);
