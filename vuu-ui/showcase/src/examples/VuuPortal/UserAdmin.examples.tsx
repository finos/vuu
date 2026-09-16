import { ModulePicker } from "user-admin";

const allItems = [
  { name: "User Admin" },
  { name: "Module Admin" },
  { name: "Basket Trading" },
];

export const DefaultModulePicker = () => (
  <ModulePicker allItems={allItems} />
);
