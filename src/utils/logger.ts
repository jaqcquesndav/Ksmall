// Niveaux de log disponibles
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Configuration par défaut
const DEFAULT_CONFIG = {
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: false,
  maxStoredLogs: 1000
};

class Logger {
  private config = { ...DEFAULT_CONFIG };
  private logs: string[] = [];

  // Formater un message de log avec horodatage et niveau
  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const formattedData = data ? ` - ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${levelName}] ${message}${formattedData}`;
  }

  // Logger un message si le niveau est suffisant
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.config.minLevel) return;

    const formattedMessage = this.format(level, message, data);

    // Afficher dans la console si activé
    if (this.config.enableConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }

    // Stocker le log si activé
    if (this.config.enableStorage) {
      this.logs.push(formattedMessage);
      
      // Limiter le nombre de logs stockés
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs = this.logs.slice(-this.config.maxStoredLogs);
      }
    }
  }

  // Méthodes publiques pour chaque niveau de log
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  // Configurer le logger
  public configure(config: Partial<typeof DEFAULT_CONFIG>): void {
    this.config = { ...this.config, ...config };
  }

  // Récupérer tous les logs stockés
  public getLogs(): string[] {
    return [...this.logs];
  }

  // Effacer les logs stockés
  public clearLogs(): void {
    this.logs = [];
  }
}

// Exporter une instance singleton du logger
const logger = new Logger();
export default logger;
