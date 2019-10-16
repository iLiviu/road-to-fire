export enum AppNotificationType {
  INFORMATIVE,
  PENDING_TRANSACTION,
  TRANSACTION_DONE,
  CUSTOM,
  RECURRING_TRANSACTION,
}
export interface AppNotification {
  id?: number;
  title: string;
  unread: boolean;
  type: AppNotificationType;
  data: any;
  date: string;
}
