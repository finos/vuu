import { ChangeEvent, useState } from "react";
import {
  NotificationsProvider,
  NotificationLevel,
  ToastNotification,
  useNotifications,
} from "@finos/vuu-popups";
import {
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
} from "@salt-ds/core";

// this example allows to fire notifications dynamically when wrapped in NotificationsProvider
const Notifications = () => {
  const [type, setType] = useState<NotificationLevel>("info");
  const [header, setHeader] = useState<string>("Header");
  const [body, setBody] = useState<string>("Body");

  const notify = useNotifications();

  const handleNotification = () => {
    notify({
      type,
      header,
      body,
    });
  };

  console.log("Render Notifications");

  return (
    <div style={{ maxWidth: 300, margin: 20 }}>
      <FormField>
        <FormFieldLabel>Notification Type</FormFieldLabel>
        <Dropdown<NotificationLevel>
          selected={[type]}
          onSelectionChange={(_, [selectedItem]) => {
            if (selectedItem) {
              setType(selectedItem);
            }
          }}
        >
          <Option value="error">Error</Option>
          <Option value="info">Info</Option>
          <Option value="success">Success</Option>
          <Option value="warning">Warning</Option>
        </Dropdown>
      </FormField>
      <FormField>
        <FormFieldLabel>Notification Header</FormFieldLabel>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setHeader(event.target.value)
          }
          value={header}
        />
      </FormField>
      <FormField>
        <FormFieldLabel>Notification Body</FormFieldLabel>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setBody(event.target.value)
          }
          value={body}
        />
      </FormField>
      <button onClick={handleNotification}>trigger notifications</button>
    </div>
  );
};

export const NotificationsWithContext = () => (
  <NotificationsProvider>
    <Notifications />
  </NotificationsProvider>
);

export const SuccessNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      type: "success",
      header: "Layout Saved Successfully",
      body: "[Layout Name] Saved Successfully",
      id: "0",
    }}
  />
);

export const ErrorNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      type: "error",
      header: "This Didn't Work",
      body: "This didn't work",
      id: "0",
    }}
  />
);

export const WarningNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      type: "warning",
      header: "This probably won't work",
      body: "This probably won't work",
      id: "0",
    }}
  />
);

export const InfoNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      type: "info",
      header: "This is Info Title",
      body: "This is Info Body",
      id: "0",
    }}
  />
);
