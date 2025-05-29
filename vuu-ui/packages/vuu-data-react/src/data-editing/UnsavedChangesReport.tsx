import { Entity } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { buildFormEditState } from "./form-edit-state";

import unsavedChangesCss from "./UnsavedChangesReport.css";

const classBase = "vuuUnsavedChanges";

export interface UnsavedChangesReportProps<T extends Entity = Entity> {
  entity: T;
  editedEntity: T;
}

export const UnsavedChangesReport = ({
  entity,
  editedEntity,
}: UnsavedChangesReportProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-unsaved-changes-report",
    css: unsavedChangesCss,
    window: targetWindow,
  });

  const { editedFields } = buildFormEditState(entity, editedEntity);

  return (
    <div className={classBase}>
      <table className={`${classBase}-table`}>
        <tbody>
          {editedFields.map((fieldName, i) => (
            <tr className={`${classBase}-row`} key={i}>
              <td className={`${classBase}-fieldName`}>{fieldName}</td>
              <td className={`${classBase}-old`}>{entity[fieldName]}</td>
              <td className={`${classBase}-new`}>{editedEntity[fieldName]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
