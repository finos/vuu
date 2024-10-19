export type CloseReason =
  | "blur"
  | "Escape"
  | "click-away"
  | "select"
  | "script"
  | "Tab"
  | "toggle";
export type OpenChangeHandler = <T extends boolean>(
  open: T,
  closeReason?: T extends false ? CloseReason : never,
) => void;
