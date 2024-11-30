import { UnsavedChangesReport } from "@finos/vuu-data-react";
import { Entity } from "@finos/vuu-utils";

export const DefaultUnsavedChangesReport = () => {
  const entity: Entity = {
    price: 200.5,
  };
  const editedEntity: Entity = {
    price: 200.55,
  };

  return (
    <div
      style={{ border: "solid 1px lightgray", height: 400, width: 300 }}
      data-showcase-center
    >
      <UnsavedChangesReport entity={entity} editedEntity={editedEntity} />
    </div>
  );
};
