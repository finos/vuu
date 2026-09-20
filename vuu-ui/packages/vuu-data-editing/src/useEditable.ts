import type { CopyOption, DataSource } from "@vuu-ui/vuu-data-types";
import { EditSession, useEditMode } from ".";
import { useCallback, useEffect, useMemo } from "react";

export interface EditableHookProps {
    copyOption?: CopyOption;
    dataSource: DataSource;
    onCancel: () => void;
    onSave: () => void;
}

export const useEditable = ({ copyOption = "Selected", dataSource, onCancel, onSave }: EditableHookProps) => {

    const { isEditMode } = useEditMode()
    // The editSession will be made available to all the edit controls in scope
    // by wrapping the edit component with a DataEditingProvider.
    const editSession = useMemo(
        () =>
            new EditSession({
                dataSource,
            }),
        [dataSource],
    );

    const handleCancel = useCallback(async () => {
        try {
            await editSession.end();
            onCancel();
        } catch (error) {
            console.error("[useEditableTable] cancel edit session failed", error);
        }
    }, [editSession, onCancel]);

    const handleSave = useCallback(
        async (force = false) => {
            try {
                await editSession.end(true, force);
                onSave();
            } catch (error) {
                console.error("[useEditableTable] save edit session failed", error);
            }
        },
        [editSession, onSave],
    );

    useEffect(() => {
        const transition = isEditMode
            ? editSession.begin(copyOption)
            : editSession.end();

        void transition.catch((error) => {
            if (isEditMode) {
                console.error("[useEditableTable] begin edit session failed", error);
                handleCancel();
            } else {
                console.error("[useEditableTable] end edit session failed", error);
            }
        });
    }, [copyOption, editSession, isEditMode, handleCancel]);


    return {
        editSession,
        onCancel: handleCancel,
        onSave: handleSave,


    }
}