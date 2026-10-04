import { createContext, type ReactNode, useContext } from "react";
import { EditSession } from "./EditSession";
import type { TableEditSession } from "./TableEditSession";

const DataEditingContext = createContext<TableEditSession | undefined>(
  undefined,
);

export const DataEditingProvider = ({
  children,
  editSession,
}: {
  children: ReactNode;
  editSession: TableEditSession;
}) => {
  return (
    <DataEditingContext.Provider value={editSession}>
      {children}
    </DataEditingContext.Provider>
  );
};

/**
 * Returns the EditSession provided by an enclosing DataEditingProvider. If the
 * provider holds some other TableEditSession (e.g. DirectEditSession), there is
 * no EditSession in scope and undefined is returned.
 */
export function useEditSession(
  throwIfUnavailable?: false,
): EditSession | undefined;
export function useEditSession(throwIfUnavailable: true): EditSession;
export function useEditSession(throwIfUnavailable = false) {
  const editSession = useContext(DataEditingContext);
  if (editSession instanceof EditSession) {
    return editSession;
  } else if (throwIfUnavailable) {
    throw Error(
      editSession === undefined
        ? "[useEditSession] no DataEditingContext in scope. You need to enclose editable component(s) with DataEditingProvider"
        : "[useEditSession] DataEditingProvider does not provide an EditSession",
    );
  }
}

/**
 * Returns whichever TableEditSession is provided by an enclosing
 * DataEditingProvider. Intended for use by Table cells, which commit and
 * cancel edits regardless of the type of session.
 */
export const useTableEditSession = () => useContext(DataEditingContext);
