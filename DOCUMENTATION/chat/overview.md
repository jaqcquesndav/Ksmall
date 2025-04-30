# API de Chat et Services - Documentation

Cette section documente les API et services de chat disponibles dans l'application Ksmall. Ces API permettent la gestion des conversations, l'envoi et la réception de messages, ainsi que des fonctionnalités avancées comme la transcription audio et la synthèse vocale.

## Architecture des Services de Chat

### Structure des fichiers

```
src/
├── services/
│   ├── ChatService.ts             # Service principal pour les opérations de chat
│   ├── VoiceMockService.ts        # Service pour les fonctionnalités audio
│   ├── MockResponseService.ts     # Service de réponses simulées pour le mode démo
│   └── api/
│       └── chat/
│           └── ChatApiService.ts  # Service API pour les requêtes chat
├── hooks/
│   └── api/
│       └── useChat.ts            # Hooks personnalisés pour les opérations de chat
├── context/
│   └── ChatContext.tsx          # Contexte React pour l'état global du chat
└── components/
    └── chat/
        ├── ChatMessage.tsx      # Composant de message
        ├── ChatInput.tsx        # Composant de saisie
        └── ...                  # Autres composants de chat
```

### Flux de Données Chat

1. **Saisie Utilisateur** : L'utilisateur entre du texte ou envoie un fichier audio via `ChatInput`
2. **Traitement par Hook** : Le hook `useChat()` gère l'envoi via `ChatApiService.sendMessage()`
3. **Communication avec l'API** : La requête est envoyée au backend
4. **Traitement de la Réponse** : La réponse est transformée et insérée dans le contexte `ChatContext`
5. **Affichage** : Les messages sont rendus par les composants UI

### Mécanismes de Gestion des Erreurs

Le module de chat implémente plusieurs niveaux de gestion d'erreurs :

1. **Niveau API** : `ChatApiService` capture les erreurs réseau et de serveur
2. **Niveau Service** : `ChatService` contient des mécanismes de repli vers des réponses locales
3. **Mode Hors Ligne** : En cas de perte de connexion, les messages sont mis en cache localement
4. **Journalisation** : Toutes les erreurs sont enregistrées pour l'analyse et le débogage

### Exemple de Gestion d'Erreur

```typescript
// Dans le hook useChat
const sendMessage = async (message: SendMessageRequest) => {
  try {
    setIsLoading(true);
    
    // Tentative d'envoi via API
    const response = await ChatApiService.sendMessage(message);
    addMessageToConversation(response);
    return response;
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du message', error);
    
    if (!NetworkService.isConnected) {
      // En mode hors ligne, stocker localement et utiliser une réponse de secours
      await OfflineQueueService.queueChatMessage(message);
      
      // Générer une réponse locale avec MockResponseService
      const fallbackResponse = await MockResponseService.generateChatResponse(message);
      fallbackResponse.metadata = {
        ...fallbackResponse.metadata,
        offlineGenerated: true
      };
      
      addMessageToConversation(fallbackResponse);
      return fallbackResponse;
    }
    
    // Afficher une erreur utilisateur appropriée
    showErrorToast("Impossible d'envoyer le message. Veuillez réessayer.");
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

## Mode Démo et Réponses Simulées

Le système de chat prend en charge un mode démo qui permet d'utiliser l'application sans connexion au backend :

1. **Détection** : `ChatService` détecte si l'application fonctionne en mode démo ou réel
2. **Simulation** : En mode démo, `MockResponseService` génère des réponses réalistes
3. **Données Sectorielles** : Les réponses simulées sont adaptées au secteur d'activité configuré

### Types de Réponses Simulées

- Réponses textuelles simples
- Suggestions d'écritures comptables
- Analyses d'inventaire
- Graphiques et visualisations de données
- Réponses voix (via `VoiceMockService`)

## Fonctionnalités principales

- **Gestion des conversations** - Créer, récupérer, mettre à jour et supprimer des conversations
- **Messagerie** - Envoyer et recevoir des messages texte avec prise en charge des pièces jointes
- **Intégration audio** - Transcription de messages vocaux et synthèse vocale de texte
- **Retour d'information** - Système de feedback sur les messages
- **Validation des suggestions** - Traitement des suggestions liées à la comptabilité ou à l'inventaire

## Structure des données

Les API de chat utilisent plusieurs interfaces de données qui définissent la structure des requêtes et des réponses :

- `SendMessageRequest` - Structure pour l'envoi d'un nouveau message
- `Conversation` - Structure d'une conversation complète
- `Message` - Structure d'un message individuel
- `GetConversationsOptions` - Options pour filtrer les conversations

## Base URL

Tous les endpoints de l'API de chat sont préfixés par `/chat`.

## Intégration avec d'autres services

Le module de chat s'intègre avec plusieurs autres services :

1. **Service de comptabilité** : Pour valider et exécuter les suggestions d'écritures comptables
2. **Service d'inventaire** : Pour analyser et ajuster les niveaux de stock
3. **Service de notification** : Pour alerter l'utilisateur des nouvelles conversations ou messages
4. **Service de stockage de fichiers** : Pour gérer les pièces jointes et les enregistrements audio

### Exemple d'intégration avec le service comptable

```typescript
// Dans ChatService
async validateAccountingEntry(messageId: string, data: any): Promise<boolean> {
  try {
    // Récupération du message contenant la suggestion
    const message = await ChatApiService.getMessage(messageId);
    
    // Extraction des données de journalisation
    const journalEntryData = message.data?.suggestion;
    
    if (!journalEntryData) {
      throw new Error('Aucune suggestion comptable valide trouvée');
    }
    
    // Utiliser le service comptable pour créer l'écriture
    const result = await AccountingService.createJournalEntry({
      ...journalEntryData,
      source: 'chat_suggestion',
      originalMessageId: messageId
    });
    
    // Mettre à jour le statut du message
    await ChatApiService.updateMessage(messageId, {
      metadata: {
        ...message.metadata,
        validated: true,
        journalEntryId: result.id
      }
    });
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la validation de l\'écriture comptable', error);
    return false;
  }
}
```

## Endpoints des messages

### Envoyer un message

**Endpoint**: `POST /chat/messages`

**Description**: Envoie un message et obtient une réponse du système.

**Corps de la requête**:
```typescript
{
  text: string;              // Contenu textuel du message
  mode: CHAT_MODES;          // Mode de conversation (assistance, comptabilité, etc.)
  conversationId?: string;   // ID de la conversation existante (optionnel)
  attachments?: Array<{      // Pièces jointes (optionnel)
    id: string;
    name: string;
    type: string;
    url: string;
    data?: string;           // Données en base64 pour les petits fichiers
  }>;
  audioData?: {              // Données audio (optionnel)
    url?: string;
    data?: string;           // Données en base64 pour les petits enregistrements
    duration: number;        // Durée en secondes
  };
  contextData?: any;         // Données contextuelles spécifiques au mode
}
```

**Réponse**: Un objet `Message` contenant la réponse du système.

**Notes**: 
- Si des pièces jointes avec des données en base64 sont présentes, la requête sera automatiquement convertie en FormData.
- Pour les gros fichiers, utilisez l'URL plutôt que les données en base64.

### Supprimer un message

**Endpoint**: `DELETE /chat/messages/:messageId`

**Description**: Supprime un message spécifique.

**Paramètres de chemin**:
- `messageId` - ID du message à supprimer

**Réponse**: Un booléen indiquant le succès ou l'échec de l'opération.

### Envoyer un feedback sur un message

**Endpoint**: `POST /chat/messages/:messageId/feedback`

**Description**: Envoie un feedback (positif ou négatif) sur un message spécifique.

**Paramètres de chemin**:
- `messageId` - ID du message concerné

**Corps de la requête**:
```typescript
{
  feedback: 'thumbs_up' | 'thumbs_down';  // Type de feedback
  comment?: string;                       // Commentaire optionnel
}
```

**Réponse**: Un booléen indiquant le succès ou l'échec de l'opération.

### Valider une suggestion

**Endpoint**: `POST /chat/messages/:messageId/validate`

**Description**: Valide et traite une suggestion de transaction ou d'inventaire issue d'un message.

**Paramètres de chemin**:
- `messageId` - ID du message contenant la suggestion

**Corps de la requête**:
```typescript
{
  type: 'journal_entry' | 'inventory';  // Type de suggestion
  data: any;                            // Données spécifiques au type
}
```

**Réponse**:
```typescript
{
  success: boolean;           // Indique si la validation a réussi
  journalEntryId?: string;    // ID de l'écriture comptable (pour type='journal_entry')
}
```

## Endpoints des conversations

### Obtenir les conversations

**Endpoint**: `GET /chat/conversations`

**Description**: Récupère la liste des conversations.

**Paramètres de requête**:
- `limit` (optionnel) - Nombre maximum de conversations à retourner
- `offset` (optionnel) - Index de départ pour la pagination
- `mode` (optionnel) - Filtrer par mode de conversation
- `query` (optionnel) - Recherche textuelle dans les titres de conversation

**Réponse**: Un tableau d'objets `Conversation`.

### Créer une conversation

**Endpoint**: `POST /chat/conversations`

**Description**: Crée une nouvelle conversation.

**Corps de la requête**:
```typescript
{
  title: string;           // Titre de la conversation
  mode: CHAT_MODES;        // Mode de la conversation
}
```

**Réponse**: Un objet `Conversation` représentant la nouvelle conversation.

### Mettre à jour une conversation

**Endpoint**: `PUT /chat/conversations/:conversationId`

**Description**: Modifie une conversation existante.

**Paramètres de chemin**:
- `conversationId` - ID de la conversation à modifier

**Corps de la requête**:
```typescript
{
  title: string;  // Nouveau titre de la conversation
}
```

**Réponse**: Un objet `Conversation` avec les données mises à jour.

### Supprimer une conversation

**Endpoint**: `DELETE /chat/conversations/:conversationId`

**Description**: Supprime une conversation et tous ses messages.

**Paramètres de chemin**:
- `conversationId` - ID de la conversation à supprimer

**Réponse**: Un booléen indiquant le succès ou l'échec de l'opération.

### Obtenir les messages d'une conversation

**Endpoint**: `GET /chat/conversations/:conversationId/messages`

**Description**: Récupère les messages d'une conversation spécifique.

**Paramètres de chemin**:
- `conversationId` - ID de la conversation

**Paramètres de requête**:
- `limit` (optionnel, défaut: 50) - Nombre maximum de messages à retourner
- `before` (optionnel) - ID du message avant lequel charger les messages (pour la pagination)

**Réponse**: Un tableau d'objets `Message`.

## Endpoints pour l'audio

### Transcrire un fichier audio

**Endpoint**: `POST /chat/transcribe`

**Description**: Convertit un enregistrement vocal en texte.

**Corps de la requête**: FormData contenant le fichier audio.

**Réponse**:
```typescript
{
  text: string;  // Texte transcrit
}
```

### Synthétiser de la parole

**Endpoint**: `POST /chat/synthesize`

**Description**: Génère un fichier audio à partir de texte (Text-to-Speech).

**Corps de la requête**:
```typescript
{
  text: string;                           // Texte à convertir en parole
  voice?: string;                         // Voix à utiliser (défaut: 'fr-FR-Standard-A')
}
```

**Réponse**:
```typescript
{
  audioUrl: string;  // URL du fichier audio généré
}
```

## Types de données

### Interface Conversation

```typescript
interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  mode: CHAT_MODES;
  messages: Message[];
}
```

### Interface Message

```typescript
interface Message {
  // Définition de l'interface Message importée de DynamicResponseBuilder
  // Consultez les composants chat pour plus de détails
}
```

### Modes de chat

Les modes de chat disponibles sont définis dans l'enum `CHAT_MODES` et peuvent inclure des options comme 'assistance', 'comptabilité', etc. Consultez le composant ModeSelector pour la liste complète des modes disponibles.

## Problèmes courants et solutions

### Problème : Messages qui échouent en mode hors ligne

**Solution** :
- Les messages sont mis en file d'attente avec `OfflineQueueService`
- Une notification locale indique le statut hors ligne
- Synchronisation automatique à la restauration de la connexion

### Problème : Fichiers audio volumineux échouant à l'envoi

**Solution** :
- Compresser les enregistrements audio avant l'envoi
- Utiliser le système de téléchargement en plusieurs parties pour les fichiers > 5MB
- Vérifier les paramètres AudioQuality pour réduire la taille des enregistrements

### Problème : Suggestions comptables incorrectes

**Solution** :
- Réviser manuellement les suggestions avant validation
- Utiliser la fonctionnalité de feedback pour améliorer les futures suggestions
- Fournir plus de contexte dans le message initial pour améliorer la précision

## Mises à jour récentes (Avril 2025)

- Amélioration de la gestion des erreurs API avec mécanismes de repli automatique
- Ajout de la prise en charge hors ligne complète pour toutes les fonctionnalités de chat
- Intégration optimisée avec les modules de comptabilité et d'inventaire
- Amélioration de la précision de transcription audio
- Nouvelles voix pour la synthèse vocale en français régional

---

_Dernière mise à jour: 30 avril 2025_