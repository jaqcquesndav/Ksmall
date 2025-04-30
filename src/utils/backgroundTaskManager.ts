import { AppState, AppStateStatus } from 'react-native';
import logger from './logger';

type Task = {
  id: string;
  execute: () => Promise<void>;
  priority: number; // 1 (haute) à 10 (basse)
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Gestionnaire de tâches en arrière-plan
 * Permet d'exécuter des tâches lourdes de manière optimisée
 */
class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private taskQueue: Task[] = [];
  private isProcessing = false;
  private appState: AppStateStatus = 'active';
  
  private constructor() {
    // Écouter les changements d'état de l'application
    AppState.addEventListener('change', this.handleAppStateChange);
  }
  
  /**
   * Obtenir l'instance singleton du gestionnaire de tâches
   */
  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }
  
  /**
   * Gérer les changements d'état de l'application
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Si l'application revient au premier plan, commencer le traitement des tâches
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.processTasks();
    }
    
    this.appState = nextAppState;
  };
  
  /**
   * Ajouter une tâche à la file d'attente
   */
  public addTask(task: Task): void {
    // Vérifier si la tâche existe déjà
    const existingTaskIndex = this.taskQueue.findIndex(t => t.id === task.id);
    if (existingTaskIndex >= 0) {
      // Remplacer la tâche existante
      this.taskQueue[existingTaskIndex] = task;
      logger.debug(`Tâche ${task.id} remplacée dans la file d'attente`);
      return;
    }
    
    this.taskQueue.push(task);
    logger.debug(`Tâche ${task.id} ajoutée à la file d'attente (priorité: ${task.priority})`);
    
    // Trier la file d'attente par priorité (du plus important au moins important)
    this.taskQueue.sort((a, b) => a.priority - b.priority);
    
    // Commencer le traitement si l'application est active et qu'aucun traitement n'est en cours
    if (this.appState === 'active' && !this.isProcessing) {
      this.processTasks();
    }
  }
  
  /**
   * Traiter les tâches de la file d'attente
   */
  private async processTasks(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0 || this.appState !== 'active') {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Récupérer la première tâche de la file d'attente
      const task = this.taskQueue.shift();
      
      if (!task) {
        this.isProcessing = false;
        return;
      }
      
      logger.debug(`Exécution de la tâche ${task.id}`);
      
      try {
        await task.execute();
        task.onSuccess?.();
        logger.debug(`Tâche ${task.id} exécutée avec succès`);
      } catch (error) {
        logger.error(`Erreur lors de l'exécution de la tâche ${task.id}:`, error);
        task.onError?.(error as Error);
      }
      
      // Petite pause pour permettre au thread principal de respirer
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Continuer avec la prochaine tâche
      this.isProcessing = false;
      this.processTasks();
    } catch (error) {
      logger.error('Erreur dans le gestionnaire de tâches:', error);
      this.isProcessing = false;
    }
  }
  
  /**
   * Vider toutes les tâches de la file d'attente
   */
  public clearTasks(): void {
    this.taskQueue = [];
    logger.debug('File d\'attente des tâches vidée');
  }
  
  /**
   * Vérifier si une tâche est en file d'attente
   */
  public hasTask(taskId: string): boolean {
    return this.taskQueue.some(task => task.id === taskId);
  }
  
  /**
   * Obtenir le nombre de tâches en file d'attente
   */
  public getQueueLength(): number {
    return this.taskQueue.length;
  }
}

export default BackgroundTaskManager.getInstance();