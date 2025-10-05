import { ChangeEvent, useState } from "react";
import {
  NotificationsProvider,
  NotificationLevel,
  useNotifications,
  ToastNotification,
} from "@vuu-ui/vuu-popups";
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

  const { showNotification } = useNotifications();

  const handleNotification = () => {
    showNotification({
      level: type,
      header,
      content: body,
      type: "toast",
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
      content: "[Layout Name] Saved Successfully",
      header: "Layout Saved Successfully",
      level: "success",
      type: "toast",
    }}
  />
);

export const ErrorNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      content: "This didn't work",
      header: "This Didn't Work",
      level: "error",
      type: "toast",
    }}
  />
);

export const WarningNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      content: "This probably won't work",
      header: "This probably won't work",
      level: "warning",
      type: "toast",
    }}
  />
);

export const InfoNotificationToast = () => (
  <ToastNotification
    top={20}
    animated={false}
    notification={{
      content: "This is Info Body",
      header: "This is Info Title",
      level: "info",
      type: "toast",
    }}
  />
);
