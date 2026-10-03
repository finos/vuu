import { SimulatedNotificationsModule } from "./SimulatedNotificationsModule";

/**
 * Simulated notifications. The provider starts generating notifications
 * when the first dataSource is created for the notifications table.
 */
export const notificationsModule = SimulatedNotificationsModule();
