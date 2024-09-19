import { Entity } from "@finos/vuu-utils";

export type FormEditState = {
  isClean: boolean;
  editedFields: string[];
};

export const CLEAN_FORM: FormEditState = {
  isClean: true,
  editedFields: [],
};

export const buildFormEditState = (
  entity: Entity | undefined,
  newEntity: Entity,
): FormEditState => {
  if (entity === undefined) {
    return CLEAN_FORM;
  } else {
    const editedFields: string[] = [];
    for (const [fieldName, value] of Object.entries(entity)) {
      if (value !== newEntity[fieldName]) {
        editedFields.push(fieldName);
      }
    }

    return {
      isClean: editedFields.length === 0,
      editedFields,
    };
  }
};
