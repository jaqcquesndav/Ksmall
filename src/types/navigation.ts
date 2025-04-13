export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { conversationId?: string; newConversation?: boolean };
  Accounting: undefined;
  AccountingDashboard: undefined;
  JournalEntry: undefined;
  Ledger: undefined;
  FinancialStatements: undefined;
  ReportGenerator: undefined;
  Notifications: undefined;
  // Ajoutez d'autres écrans au besoin
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
