import { ChangeEvent, useState } from "react";

import { Dropdown } from "@finos/vuu-ui-controls";
import { NotificationsProvider, ToastTypes, useNotifications } from "@finos/vuu-shell";
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
        <div style={{maxWidth: 500, display: 'flex', flexDirection: 'column'}}>
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

export const NotificationsWithContext = () => {
    return (
        <NotificationsProvider>
            <Notifications />
        </NotificationsProvider>
    );
};

NotificationsWithContext.displaySequence = displaySequence++;
