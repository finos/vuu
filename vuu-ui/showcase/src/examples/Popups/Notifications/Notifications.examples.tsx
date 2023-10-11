import { ChangeEvent, useState } from "react";
import { Dropdown } from "@finos/vuu-ui-controls";
import { NotificationsProvider, ToastTypes, ToastNotification, useNotifications } from "@finos/vuu-popups";
import { Input } from "@salt-ds/core";

let displaySequence = 1;

const notificationTypes: ToastTypes[] = ["warning", "error", "info", "success"]

const Notifications = () => {
    const [type, setType] = useState<ToastTypes>(notificationTypes[0])
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
        <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>
                <label>Notification Type</label>
                <Dropdown
                    defaultSelected={notificationTypes[0]}
                    onSelectionChange={(_, selectedItem) => setType(selectedItem as ToastTypes)}
                    source={notificationTypes}
                />
            </div>
            <div style={{ display: 'flex' }}>
                <label>Notification Title/Action</label>
                <Input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setHeader(event.target.value)}
                    value={header} />
            </div>
            <div style={{ display: 'flex' }}>
                <label>Notification Message</label>
                <Input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setBody(event.target.value)}
                    value={body} />
            </div>
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
        top={0}
        animated={false}
        notification={{
            type: "success",
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
            type: "error",
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
            type: "warning",
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
            type: "info",
            header: "This is Info Title",
            body: "This is Info Body",
            id: "0"
        }}
    />

InfoNotificationToast.displaySequence = displaySequence++;
