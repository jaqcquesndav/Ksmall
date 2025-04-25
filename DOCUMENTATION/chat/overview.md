# API de Chat - Documentation

Cette section documente les API de chat disponibles dans l'application Ksmall. Ces API permettent la gestion des conversations, l'envoi et la réception de messages, ainsi que des fonctionnalités avancées comme la transcription audio et la synthèse vocale.

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