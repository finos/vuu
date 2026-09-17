import { useCallback, useState } from "react";
import { ModulePicker } from "user-admin";
import { ModulePickerModuleDescriptor } from "user-admin/src/components/module-picker/ModulePicker";

const allModules: ModulePickerModuleDescriptor[] = [
  { name: "User Admin", permissions: ["read", "admin"], selectedPermissions: [] },
  { name: "Module Admin", permissions: ["read", "admin"], selectedPermissions: [] },
  { name: "Basket Trading", permissions: ["read", "trader"], selectedPermissions: [] },
];

export const DefaultModulePicker = () => {
  const [selectedModules, setSelectedModules] = useState<
    ModulePickerModuleDescriptor[]
  >([]);

  const onSelectedModulesChange = useCallback(
    (newSelectedModules: ModulePickerModuleDescriptor[]) => {
      console.log(`onSelectedModulesChange ${JSON.stringify(newSelectedModules, null, 2)}`)
      setSelectedModules(newSelectedModules);
    },
    [],
  );

  return (
    <ModulePicker
      allModules={allModules}
      style={{ width: 300 }}
      selectedModules={selectedModules}
      onSelectedModulesChange={onSelectedModulesChange}
    />
  );
};

