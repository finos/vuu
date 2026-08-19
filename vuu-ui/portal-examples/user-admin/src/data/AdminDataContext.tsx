import { createContext, useContext } from "react";
import { EMPTY_CONFIG, type AdminConfig } from "./admin-contract";

export const AdminDataContext = createContext<AdminConfig>(EMPTY_CONFIG);
export const useAdminConfig = () => useContext(AdminDataContext);
