
// Script temporaire pour réinitialiser certaines clés AsyncStorage problématiques
import AsyncStorage from '@react-native-async-storage/async-storage';

const resetSyncMetadata = async () => {
  console.log('Réinitialisation des métadonnées de synchronisation...');
  const keysToReset = [
    'last_sync_time',
    'auto_sync_enabled',
    '@ksmall/offline_queue',
    '@ksmall/pending_conflicts',
    '@ksmall/last_sync_time',
    '@ksmall/connection_status'
  ];
  
  try {
    await Promise.all(keysToReset.map(key => AsyncStorage.removeItem(key)));
    console.log('Métadonnées de synchronisation réinitialisées avec succès');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
  }
};

export default resetSyncMetadata;
  