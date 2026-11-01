import { createContext, useContext } from "react";
import type { EditFormHookResult } from "../useEditForm";

export const EditFormContext = createContext<EditFormHookResult | undefined>(
  undefined,
);

/**
 * Returns the state of the enclosing `EditForm`, or undefined outside a form.
 * Use it in custom field components to read `fieldErrors`, `mode`, `saving`
 * etc.
 */
export const useEditFormContext = () => useContext(EditFormContext);
