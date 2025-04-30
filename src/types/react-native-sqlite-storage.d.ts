declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    executeSql(
      sqlStatement: string,
      params?: any[]
    ): Promise<[SQLResultSet]>;
    transaction(
      fn: (tx: SQLTransaction) => void
    ): Promise<void>;
    readTransaction(
      fn: (tx: SQLTransaction) => void
    ): Promise<void>;
    close(): Promise<void>;
    attach(dbName: string, alias: string, location?: string, callback?: () => void): Promise<void>;
    detach(alias: string, callback?: () => void): Promise<void>;
  }

  export interface SQLTransaction {
    executeSql(
      sqlStatement: string,
      params?: any[],
      success?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
      error?: (transaction: SQLTransaction, error: Error) => void
    ): void;
  }

  export interface SQLResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: SQLResultSetRowList;
  }

  export interface SQLResultSetRowList {
    length: number;
    item(index: number): any;
  }

  export type SQLiteType = {
    openDatabase(
      database: {
        name: string;
        location?: string;
        createFromLocation?: number | string;
      },
      success?: (db: SQLiteDatabase) => void,
      error?: (error: Error) => void
    ): Promise<SQLiteDatabase>;
    deleteDatabase(
      database: {
        name: string;
        location?: string;
      },
      success?: () => void,
      error?: (error: Error) => void
    ): Promise<void>;
    echoTest(): Promise<any>;
    enablePromise(enable: boolean): void;
    DEBUG(enable: boolean): void;
  };

  export interface WebSQLDatabase {
    transaction: (callback: (transaction: SQLTransaction) => void, error?: (error: any) => void, success?: () => void) => void;
    readTransaction: (callback: (transaction: SQLTransaction) => void, error?: (error: any) => void, success?: () => void) => void;
    executeSql: (sqlStatement: string, args?: any[], callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void, error?: (transaction: SQLTransaction, error: Error) => void) => void;
  }

  const SQLite: SQLiteType;
  export default SQLite;
}