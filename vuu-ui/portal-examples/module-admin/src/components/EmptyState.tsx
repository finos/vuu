import { Button, Text } from "@salt-ds/core";
import { AddIcon, LayersIcon } from "@salt-ds/icons";

const classBase = "vuuModuleAdmin";

export const EmptyState = ({
  filtered,
  onClearFilters,
  onCreate,
}: {
  filtered: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}) => (
  <div className={`${classBase}-empty`}>
    <span className={`${classBase}-emptyIcon`}>
      <LayersIcon aria-hidden size={2} />
    </span>
    {filtered ? (
      <>
        <h2>No modules match</h2>
        <Text color="secondary">Try a different search or filter.</Text>
        <Button onClick={onClearFilters}>Clear filters</Button>
      </>
    ) : (
      <>
        <h2>No modules registered yet</h2>
        <Text color="secondary">
          Modules registered here are offered to users by module discovery and
          shown in the portal menu.
        </Text>
        <ol className={`${classBase}-emptySteps`}>
          <li>Build and host the remote with module federation.</li>
          <li>Register it here with its URL, scope and exposed component.</li>
          <li>Choose who can open it and where it appears in the menu.</li>
        </ol>
        <Button onClick={onCreate} sentiment="accented">
          <AddIcon aria-hidden /> Register a module
        </Button>
      </>
    )}
  </div>
);
