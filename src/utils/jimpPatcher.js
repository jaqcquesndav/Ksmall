/**
 * PATCH POUR ERREUR JIMP - COMPATIBLE HERMES
 * Ce fichier utilise uniquement la syntaxe ES Modules compatible avec Hermes
 */

// Exportation de la fonction principale pour l'utiliser via import
export function applyJimpPatches() {
  // Détection si déjà appliqué
  if (global.__JIMP_PATCHES_APPLIED__) {
    console.log('[JimpPatcher] Patches déjà appliqués, ignoré');
    return;
  }
  
  console.log('⚡ [JimpPatcher] Application de la protection contre les erreurs Jimp...');

  try {
    // Protection 1: Intercepter les erreurs globales liées à Jimp
    const originalErrorHandler = global.ErrorUtils && global.ErrorUtils.reportFatalError;
    if (originalErrorHandler) {
      global.ErrorUtils.reportFatalError = (error, isFatal) => {
        // Bloquer uniquement les erreurs Jimp, laisser passer les autres
        if (error && error.message && error.message.includes('Could not find MIME for Buffer')) {
          console.warn('[JimpPatcher] ✓ Erreur Jimp interceptée et bloquée');
          return;
        }
        return originalErrorHandler(error, isFatal);
      };
    }

    // Protection 2: Stocker un faux PNG valide dans une variable globale
    // pour être utilisé comme fallback
    global.__FAKE_PNG__ = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Protection 3: Créer un objet global avec des méthodes d'interception
    // qui pourront être utilisées plus tard
    global.__JIMP_SAFE_HANDLERS__ = {
      // Interception pour parseBitmap
      handleParseBitmap: (data, instance) => {
        if (!data || data.length === 0) {
          console.warn('[JimpPatcher] Données d\'image invalides interceptées');
          if (instance) {
            instance.bitmap = {
              data: new Uint8Array(4), // RGBA pour un pixel
              width: 1,
              height: 1
            };
          }
          return false; // Indique qu'il faut interrompre le traitement normal
        }
        return true; // Continuer le traitement normal
      },
      
      // Interception pour les erreurs de lecture d'image
      handleImageReadError: (error, instance) => {
        console.warn('[JimpPatcher] Erreur de lecture d\'image interceptée:', error.message);
        if (instance) {
          instance.bitmap = {
            data: new Uint8Array(4),
            width: 1,
            height: 1
          };
        }
        return instance || {};
      }
    };

    // Protection 4: Configurer un Observer pour patcher Jimp quand il sera chargé
    // Cette méthode utilise setTimeout qui est compatible avec Hermes
    setTimeout(() => {
      try {
        console.log('[JimpPatcher] Recherche de Jimp dans l\'environnement global...');
        
        // Cette fonction peut scanner plusieurs fois à des intervalles différents
        const scanForJimp = () => {
          const globalContext = typeof window !== 'undefined' ? window : global;
          let jimpFound = false;
          
          // Chercher Jimp dans l'environnement global
          for (const key in globalContext) {
            try {
              const obj = globalContext[key];
              // Vérifie si c'est un objet qui ressemble à Jimp
              if (obj && typeof obj === 'object' && 
                  (obj.parseBitmap || 
                   (obj.prototype && obj.prototype.parseBitmap))) {
                
                jimpFound = true;
                console.log(`[JimpPatcher] Jimp trouvé dans global.${key}`);
                
                // Patcher la méthode statique si elle existe
                if (obj.parseBitmap && typeof obj.parseBitmap === 'function') {
                  const originalParseBitmap = obj.parseBitmap;
                  obj.parseBitmap = function(data) {
                    // Utiliser le handler sécurisé
                    if (!global.__JIMP_SAFE_HANDLERS__.handleParseBitmap(data, this)) {
                      return this;
                    }
                    try {
                      return originalParseBitmap.call(this, data);
                    } catch (e) {
                      return global.__JIMP_SAFE_HANDLERS__.handleImageReadError(e, this);
                    }
                  };
                }
                
                // Patcher le prototype
                if (obj.prototype && obj.prototype.parseBitmap && 
                    typeof obj.prototype.parseBitmap === 'function') {
                  const originalProtoParseBitmap = obj.prototype.parseBitmap;
                  obj.prototype.parseBitmap = function(data) {
                    // Utiliser le handler sécurisé
                    if (!global.__JIMP_SAFE_HANDLERS__.handleParseBitmap(data, this)) {
                      return this;
                    }
                    try {
                      return originalProtoParseBitmap.call(this, data);
                    } catch (e) {
                      return global.__JIMP_SAFE_HANDLERS__.handleImageReadError(e, this);
                    }
                  };
                }
              }
            } catch (err) {
              // Ignorer les erreurs pour chaque propriété
            }
          }
          
          return jimpFound;
        };
        
        // Première tentative immédiate
        if (!scanForJimp()) {
          // Si pas trouvé, réessayer plusieurs fois avec délai croissant
          setTimeout(() => scanForJimp(), 100);
          setTimeout(() => scanForJimp(), 500);
          setTimeout(() => scanForJimp(), 2000);
        }
        
      } catch (scanError) {
        console.warn('[JimpPatcher] Erreur lors du scan global:', scanError);
      }
    }, 0);

    // Protection 5: Marquer les patches comme appliqués
    global.__JIMP_PATCHES_APPLIED__ = true;
    console.log('✅ [JimpPatcher] Protections contre les erreurs Jimp activées');
    
  } catch (error) {
    console.error('[JimpPatcher] Erreur lors de l\'application des patches:', error);
  }
}

// Exporter d'autres fonctions utilitaires si nécessaire
export function isJimpPatchApplied() {
  return !!global.__JIMP_PATCHES_APPLIED__;
}

// Appliquer automatiquement les patches à l'importation du module
applyJimpPatches();