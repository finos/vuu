import { ChangeEvent, useState } from "react";
import { Dropdown } from "@finos/vuu-ui-controls";
import { NotificationsProvider, NotificationLevel, ToastNotification, useNotifications } from "@finos/vuu-popups";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";

let displaySequence = 1;

// this example allows to fire notifications dynamically when wrapped in NotificationsProvider
const Notifications = () => {
    const [type, setType] = useState<NotificationLevel>(NotificationLevel.Info)
    const [header, setHeader] = useState<string>("Header")
    const [body, setBody] = useState<string>("Body")

    const { notify } = useNotifications();

    const handleNotification = () => {
        notify({
            type,
            header,
            body
        })
    }

    return (
        <div style={{ maxWidth: 300 }}>
            <FormField>
                <FormFieldLabel>Notification Type</FormFieldLabel>
                <Dropdown
                    defaultSelected={NotificationLevel.Info}
                    selected={type}
                    onSelectionChange={(_, selectedItem) => {
                        if (selectedItem) {
                            setType(selectedItem)
                        }
                    }}
                    source={Object.values(NotificationLevel)}
                />
            </FormField>
            <FormField>
                <FormFieldLabel>Notification Header</FormFieldLabel>
                <Input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setHeader(event.target.value)}
                    value={header} />
            </FormField>
            <FormField>
                <FormFieldLabel>Notification Body</FormFieldLabel>
                <Input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setBody(event.target.value)}
                    value={body} />
            </FormField>
            <button onClick={handleNotification}>trigger notifications</button>
        </div>
    );
};

export const NotificationsWithContext = () =>
    <NotificationsProvider>
        <Notifications />
    </NotificationsProvider>

NotificationsWithContext.displaySequence = displaySequence++;

export const SuccessNotificationToast = () =>
    <ToastNotification
        top={20}
        animated={false}
        notification={{
            type: NotificationLevel.Success,
            header: "Layout Saved Successfully",
            body: "[Layout Name] Saved Successfully",
            id: "0"
        }}
    />

SuccessNotificationToast.displaySequence = displaySequence++;

export const ErrorNotificationToast = () =>
    <ToastNotification
        top={20}
        animated={false}
        notification={{
            type: NotificationLevel.Error,
            header: "This Didn't Work",
            body: "This didn't work",
            id: "0"
        }}
    />

ErrorNotificationToast.displaySequence = displaySequence++;

export const WarningNotificationToast = () =>
    <ToastNotification
        top={20}
        animated={false}
        notification={{
            type: NotificationLevel.Warning,
            header: "This probably won't work",
            body: "This probably won't work",
            id: "0"
        }}
    />

WarningNotificationToast.displaySequence = displaySequence++;

export const InfoNotificationToast = () =>
    <ToastNotification
        top={20}
        animated={false}
        notification={{
            type: NotificationLevel.Info,
            header: "This is Info Title",
            body: "This is Info Body",
            id: "0"
        }}
    />

InfoNotificationToast.displaySequence = displaySequence++;
