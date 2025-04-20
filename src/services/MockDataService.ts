import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import DatabaseService from './DatabaseService';

/**
 * Service centralisant les données de démonstration pour l'application.
 * 
 * Ce service sert de "source de vérité unique" pour les données mockées.
 * À terme, ces fonctions pourront être remplacées par des appels à un backend distant.
 */
class MockDataService {
  // Valeurs par défaut pour les données de démonstration
  private readonly DEFAULT_CREDIT_SCORE = 70;
  private readonly DEFAULT_ESG_RATING = 'B+';
  
  // Clés pour le stockage local
  private readonly CREDIT_SCORE_KEY = 'mock_credit_score';
  private readonly ESG_RATING_KEY = 'mock_esg_rating';
  
  /**
   * Initialise les données mockées dans la base de données
   * Cette fonction devrait être appelée au démarrage de l'application en mode démo
   */
  async initializeMockData(): Promise<void> {
    try {
      const creditScore = await this.getCreditScore();
      
      // Initialiser les métriques de l'utilisateur dans la base de données
      const db = await DatabaseService.getDatabase();
      
      // Vérifier si la table user_metrics existe déjà
      const [tableExists] = await DatabaseService.executeQuery(
        db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='user_metrics'",
        []
      );
      
      // Créer la table si elle n'existe pas
      if (!tableExists || tableExists.rows.length === 0) {
        await DatabaseService.executeQuery(
          db,
          `CREATE TABLE IF NOT EXISTS user_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            metric_name TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          []
        );
      }
      
      // Insérer ou mettre à jour la cote de crédit dans user_metrics
      await this.updateMetricInDatabase('credit_score', creditScore.toString());
      
      // Insérer ou mettre à jour la note ESG dans user_metrics
      const esgRating = await this.getESGRating();
      await this.updateMetricInDatabase('esg_rating', esgRating);
      
      // S'assurer que user_profile contient également la cote de crédit
      await this.ensureUserProfileHasCreditScore(creditScore);
      
      logger.info('Données mockées initialisées avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des données mockées:', error);
    }
  }
  
  /**
   * Récupère la cote de crédit mockée
   * @returns Cote de crédit entre 0 et 100
   */
  async getCreditScore(): Promise<number> {
    try {
      const storedScore = await AsyncStorage.getItem(this.CREDIT_SCORE_KEY);
      if (storedScore !== null) {
        return parseInt(storedScore, 10);
      }
      
      // Valeur par défaut si non définie
      await AsyncStorage.setItem(this.CREDIT_SCORE_KEY, this.DEFAULT_CREDIT_SCORE.toString());
      return this.DEFAULT_CREDIT_SCORE;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la cote de crédit mockée:', error);
      return this.DEFAULT_CREDIT_SCORE;
    }
  }
  
  /**
   * Met à jour la cote de crédit mockée
   * @param score Nouvelle cote de crédit (0-100)
   */
  async updateCreditScore(score: number): Promise<void> {
    try {
      // Assurer que le score est dans la plage 0-100
      const validScore = Math.min(100, Math.max(0, score));
      
      // Mettre à jour dans AsyncStorage (source primaire)
      await AsyncStorage.setItem(this.CREDIT_SCORE_KEY, validScore.toString());
      
      // Mettre à jour dans la base de données (pour cohérence)
      await this.updateMetricInDatabase('credit_score', validScore.toString());
      
      // Mettre à jour dans user_profile (pour compatibilité avec le code existant)
      await this.ensureUserProfileHasCreditScore(validScore);
      
      logger.debug('Cote de crédit mockée mise à jour:', validScore);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la cote de crédit mockée:', error);
      throw error;
    }
  }
  
  /**
   * Récupère la note ESG mockée
   * @returns Note ESG (A+, A, B+, etc.)
   */
  async getESGRating(): Promise<string> {
    try {
      const storedRating = await AsyncStorage.getItem(this.ESG_RATING_KEY);
      if (storedRating) {
        return storedRating;
      }
      
      // Valeur par défaut si non définie
      await AsyncStorage.setItem(this.ESG_RATING_KEY, this.DEFAULT_ESG_RATING);
      return this.DEFAULT_ESG_RATING;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la note ESG mockée:', error);
      return this.DEFAULT_ESG_RATING;
    }
  }
  
  /**
   * Met à jour la note ESG mockée
   * @param rating Nouvelle note ESG (A+, A, B+, etc.)
   */
  async updateESGRating(rating: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ESG_RATING_KEY, rating);
      await this.updateMetricInDatabase('esg_rating', rating);
      logger.debug('Note ESG mockée mise à jour:', rating);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la note ESG mockée:', error);
      throw error;
    }
  }
  
  /**
   * Met à jour une métrique dans la base de données
   * @param metricName Nom de la métrique
   * @param value Valeur de la métrique
   */
  private async updateMetricInDatabase(metricName: string, value: string): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      
      // Vérifier si la métrique existe déjà
      const [existingMetric] = await DatabaseService.executeQuery(
        db,
        "SELECT id FROM user_metrics WHERE metric_name = ?",
        [metricName]
      );
      
      if (existingMetric && existingMetric.rows.length > 0) {
        // Mettre à jour la métrique existante
        await DatabaseService.executeQuery(
          db,
          "UPDATE user_metrics SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_name = ?",
          [value, metricName]
        );
      } else {
        // Insérer une nouvelle métrique
        await DatabaseService.executeQuery(
          db,
          "INSERT INTO user_metrics (user_id, metric_name, value) VALUES (?, ?, ?)",
          [1, metricName, value]
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la métrique ${metricName}:`, error);
    }
  }
  
  /**
   * S'assure que le profil utilisateur a une cote de crédit
   * @param creditScore Cote de crédit à définir
   */
  private async ensureUserProfileHasCreditScore(creditScore: number): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      
      // Vérifier si la table user_profile existe
      const [tableExists] = await DatabaseService.executeQuery(
        db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='user_profile'",
        []
      );
      
      if (!tableExists || tableExists.rows.length === 0) {
        // Créer une table user_profile minimale si elle n'existe pas
        await DatabaseService.executeQuery(
          db,
          `CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            credit_score INTEGER DEFAULT ${creditScore},
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          []
        );
        
        // Insérer un profil par défaut avec seulement l'ID et le credit_score
        await DatabaseService.executeQuery(
          db,
          "INSERT INTO user_profile (id, credit_score) VALUES (?, ?)",
          [1, creditScore]
        );
      } else {
        // Examiner la structure de la table existante
        const [columns] = await DatabaseService.executeQuery(
          db, 
          "PRAGMA table_info(user_profile)",
          []
        );
        
        // Vérifier si credit_score existe dans la table
        let hasCreditScore = false;
        for (let i = 0; i < columns.rows.length; i++) {
          if (columns.rows.item(i).name === 'credit_score') {
            hasCreditScore = true;
            break;
          }
        }
        
        // Ajouter la colonne credit_score si elle n'existe pas
        if (!hasCreditScore) {
          await DatabaseService.executeQuery(
            db,
            `ALTER TABLE user_profile ADD COLUMN credit_score INTEGER DEFAULT ${creditScore}`,
            []
          );
        }
        
        // Vérifier si le profil existe
        const [profileExists] = await DatabaseService.executeQuery(
          db,
          "SELECT id FROM user_profile WHERE id = 1",
          []
        );
        
        if (profileExists && profileExists.rows.length > 0) {
          // Mettre à jour le profil existant
          await DatabaseService.executeQuery(
            db,
            "UPDATE user_profile SET credit_score = ? WHERE id = 1",
            [creditScore]
          );
        } else {
          // Insérer un profil par défaut minimal
          await DatabaseService.executeQuery(
            db,
            "INSERT INTO user_profile (id, credit_score) VALUES (?, ?)",
            [1, creditScore]
          );
        }
      }
      
      logger.debug('Profil utilisateur mis à jour avec le crédit score:', creditScore);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil utilisateur:', error);
    }
  }
}

export default new MockDataService();