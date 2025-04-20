import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Share } from 'react-native';
import { Card, IconButton, Badge, Divider, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { formatTime } from '../../utils/formatters';
import JournalEntryWidget from '../accounting/DynamicJournalEntryWidget';
import InventoryWidget from '../inventory/InventoryWidget';
import AnalysisWidget from '../analytics/AnalysisWidget'; // Verify the file exists or correct the path
import CodeBlock from '../common/CodeBlock';
import logger from '../../utils/logger';
import { CHAT_MODES } from './ModeSelector';

// Export pour utilisation externe
export enum MESSAGE_TYPES {
  REGULAR_CHAT = 'regular_chat',
  JOURNAL_ENTRY = 'journal_entry',
  INVENTORY = 'inventory',
  ANALYSIS = 'analysis',
  MARKDOWN = 'markdown',
  LATEX = 'latex',
  CODE = 'code'
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  content: string;
  messageType: MESSAGE_TYPES;
  isUser: boolean;
  timestamp: string;
  attachments?: MessageAttachment[];
  status?: 'pending' | 'validated' | 'error';
  journalData?: any;
  inventoryData?: any;
  analysisData?: any;
  codeLanguage?: string;
  userReaction?: 'like' | 'dislike' | null;
  isSystemMessage?: boolean; // Ajout de cette propriété pour les messages système
}

export interface InventoryData {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalValue: number;
}

interface DynamicResponseBuilderProps {
  message: Message;
  onValidate?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onAttach?: (message: Message) => void;
  currentMode?: CHAT_MODES;
}

const DynamicResponseBuilder: React.FC<DynamicResponseBuilderProps> = ({
  message,
  onValidate,
  onEdit,
  onDelete,
  onAttach,
  currentMode = CHAT_MODES.REGULAR
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [liked, setLiked] = useState<boolean | null>(message.userReaction === 'like');
  const [disliked, setDisliked] = useState<boolean | null>(message.userReaction === 'dislike');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const handleCopyToClipboard = async () => {
    try {
      await Share.share({
        message: message.content
      });
    } catch (error) {
      logger.error('Error copying message', error);
    }
  };
  
  const handleLike = () => {
    setLiked(true);
    setDisliked(false);
    // Ici, vous pouvez envoyer la réaction à votre backend
  };
  
  const handleDislike = () => {
    setLiked(false);
    setDisliked(true);
    // Ici, vous pouvez envoyer la réaction à votre backend
  };

  // Permettre la modification des données avant validation
  const handleEdit = () => {
    if (message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY) {
      setEditedData({...message.journalData});
      setIsEditing(true);
    } else if (message.messageType === MESSAGE_TYPES.INVENTORY) {
      setEditedData({...message.inventoryData});
      setIsEditing(true);
    } else {
      onEdit?.(message);
    }
  };

  const saveEditedData = () => {
    const updatedMessage = {...message};
    
    if (message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY) {
      updatedMessage.journalData = editedData;
    } else if (message.messageType === MESSAGE_TYPES.INVENTORY) {
      updatedMessage.inventoryData = editedData;
    }
    
    onEdit?.(updatedMessage);
    setIsEditing(false);
    setEditedData(null);
  };

  // Rendre le contenu du message en fonction du type
  const renderContent = () => {
    if (isEditing) {
      if (message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY) {
        return (
          <>
            <JournalEntryWidget 
              data={editedData}
              status="pending"
              isEditing={true}
              onEditChange={(data) => setEditedData(data)}
            />
            <View style={styles.editActionButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={styles.editButton}
              >
                {t('cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={saveEditedData}
                style={styles.editButton}
              >
                {t('save_changes')}
              </Button>
            </View>
          </>
        );
      } else if (message.messageType === MESSAGE_TYPES.INVENTORY) {
        return (
          <>
            <InventoryWidget 
              data={editedData}
              status="pending"
              isEditing={true}
              onEditChange={(data) => setEditedData(data)}
            />
            <View style={styles.editActionButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={styles.editButton}
              >
                {t('cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={saveEditedData}
                style={styles.editButton}
              >
                {t('save_changes')}
              </Button>
            </View>
          </>
        );
      }
    }

    switch (message.messageType) {
      case MESSAGE_TYPES.JOURNAL_ENTRY:
        return (
          <>
            <JournalEntryWidget data={message.journalData} status={message.status} onValidate={() => onValidate?.(message)} />
            {message.status === 'pending' && (
              <Text style={styles.editHintText}>{t('edit_before_validate')}</Text>
            )}
          </>
        );
      
      case MESSAGE_TYPES.INVENTORY:
        return (
          <>
            <InventoryWidget data={message.inventoryData} status={message.status} onValidate={() => onValidate?.(message)} />
            {message.status === 'pending' && (
              <Text style={styles.editHintText}>{t('edit_before_validate')}</Text>
            )}
          </>
        );
      
      case MESSAGE_TYPES.ANALYSIS:
        return <AnalysisWidget data={message.analysisData} />;
      
      case MESSAGE_TYPES.MARKDOWN:
        return <Markdown>{message.content}</Markdown>;
      
      case MESSAGE_TYPES.CODE:
        return <CodeBlock code={message.content} language={message.codeLanguage || 'javascript'} />;
      
      case MESSAGE_TYPES.LATEX:
        // Implémentation à venir pour LaTeX
        return <Text>{message.content}</Text>;
      
      default:
        // Message régulier
        return <Text style={styles.messageText}>{message.content}</Text>;
    }
  };

  // Rendre les actions disponibles en fonction du mode et du type de message
  const renderActions = () => {
    const isAccountingOrInventory = currentMode === CHAT_MODES.ACCOUNTING || currentMode === CHAT_MODES.INVENTORY;
    const isRegularOrAnalysis = currentMode === CHAT_MODES.REGULAR || currentMode === CHAT_MODES.ANALYSIS;
    
    if (message.isUser) {
      // Pas d'actions pour les messages utilisateur
      return null;
    }

    return (
      <View style={styles.actionsContainer}>
        {isAccountingOrInventory && (
          <>
            <IconButton
              icon="pencil"
              size={18}
              style={styles.actionButton}
              onPress={handleEdit}
              disabled={message.status === 'validated' || isEditing}
            />
            <IconButton
              icon="delete"
              size={18}
              style={styles.actionButton}
              onPress={() => onDelete?.(message)}
              disabled={isEditing}
            />
            <IconButton
              icon="paperclip"
              size={18}
              style={styles.actionButton}
              onPress={() => onAttach?.(message)}
              disabled={isEditing}
            />
          </>
        )}
        
        {isRegularOrAnalysis && (
          <>
            <IconButton
              icon={liked ? "thumb-up" : "thumb-up-outline"}
              size={18}
              style={styles.actionButton}
              onPress={handleLike}
              iconColor={liked ? theme.colors.primary : undefined}
            />
            <IconButton
              icon={disliked ? "thumb-down" : "thumb-down-outline"}
              size={18}
              style={styles.actionButton}
              onPress={handleDislike}
              iconColor={disliked ? theme.colors.error : undefined}
            />
            <IconButton
              icon="content-copy"
              size={18}
              style={styles.actionButton}
              onPress={handleCopyToClipboard}
            />
          </>
        )}
      </View>
    );
  };

  // Calculer le style du message en fonction de l'expéditeur
  const messageContainerStyle = [
    styles.messageContainer,
    message.isUser ? styles.userMessage : styles.assistantMessage
  ];

  return (
    <Card style={messageContainerStyle}>
      <Card.Content>
        <View style={styles.messageHeader}>
          <Text style={styles.messageSender}>
            {message.isUser ? t('you') : 'Adha'}
          </Text>
          
          {renderActions()}
          
          <Text style={styles.messageTime}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        
        <View style={styles.messageBody}>
          {renderContent()}
        </View>
        
        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map(attachment => (
              <Badge 
                key={attachment.id}
                style={styles.attachmentBadge}
              >
                {attachment.name}
              </Badge>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 1,
  },
  userMessage: {
    marginLeft: 40,
    backgroundColor: '#E3F2FD',
  },
  assistantMessage: {
    marginRight: 40,
    backgroundColor: '#FFFFFF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSender: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 'auto',
  },
  messageBody: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  attachmentBadge: {
    margin: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginRight: 'auto', // Placer les actions à gauche
  },
  actionButton: {
    margin: 0, // Réduire les marges pour économiser de l'espace
  },
  editActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  editButton: {
    marginLeft: 8,
  },
  editHintText: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DynamicResponseBuilder;
