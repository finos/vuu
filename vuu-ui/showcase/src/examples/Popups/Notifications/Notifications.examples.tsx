import { ChangeEvent, useState } from "react";
import { Dropdown } from "@finos/vuu-ui-controls";
import { NotificationsProvider, NotificationLevel, ToastNotification, useNotifications } from "@finos/vuu-popups";
import { Input } from "@salt-ds/core";

let displaySequence = 1;


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
        <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>
                <label>Notification Type</label>
                <Dropdown
                    defaultSelected={NotificationLevel.Info}
                    onSelectionChange={(_, selectedItem) => {
                        if (selectedItem) {
                            setType(selectedItem)
                        }
                    }}
                    source={Object.values(NotificationLevel)}
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
