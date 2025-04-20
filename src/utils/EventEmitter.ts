/**
 * Un service d'événements simple pour gérer la communication entre les composants
 */

type EventHandler<T = any> = (data: T) => void;

class EventEmitter {
  private events: Map<string, EventHandler[]> = new Map();

  /**
   * S'abonner à un événement
   * @param event Nom de l'événement
   * @param handler Fonction à appeler lorsque l'événement est émis
   * @returns Fonction pour se désabonner
   */
  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const handlers = this.events.get(event) || [];
    handlers.push(handler);
    this.events.set(event, handlers);
    
    // Retourner une fonction pour se désabonner
    return () => {
      const handlers = this.events.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.events.set(event, handlers);
      }
    };
  }
  
  /**
   * S'abonner à un événement et se désabonner après sa première émission
   * @param event Nom de l'événement
   * @param handler Fonction à appeler lorsque l'événement est émis
   * @returns Fonction pour se désabonner
   */
  once<T>(event: string, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on(event, (data: T) => {
      handler(data);
      unsubscribe();
    });
    
    return unsubscribe;
  }

  /**
   * Émettre un événement
   * @param event Nom de l'événement
   * @param data Données à passer aux handlers
   */
  emit<T>(event: string, data: T): void {
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  /**
   * Supprimer tous les handlers pour un événement
   * @param event Nom de l'événement
   */
  removeAllListeners(event: string): void {
    this.events.delete(event);
  }
}

// Singleton pour être utilisé dans toute l'application
const eventEmitter = new EventEmitter();

export default eventEmitter;