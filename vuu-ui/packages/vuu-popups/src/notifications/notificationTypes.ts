export type NotificationLevel = "info" | "success" | "warning" | "error";

export type Notification = {
  type: NotificationLevel;
  header: string;
  body: string;
  id: string;
};
