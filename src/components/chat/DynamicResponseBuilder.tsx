import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import JournalEntryCard from '../accounting/JournalEntryCard';
import InventoryItemList from '../inventory/InventoryItemList';
import CodeBlock from '../common/CodeBlock';
import MarkdownRenderer from '../common/MarkdownRenderer';
import LatexRenderer from '../common/LatexRenderer';
import AnalysisCard from '../analytics/AnalysisCard';
import { JournalEntry } from '../accounting/DynamicJournalEntryWidget';
import { formatTime } from '../../utils/formatters';

export enum MESSAGE_TYPES {
  REGULAR_CHAT = 'regular_chat',
  JOURNAL_ENTRY = 'journal_entry',
  INVENTORY = 'inventory',
  ANALYSIS = 'analysis',
  MARKDOWN = 'markdown',
  LATEX = 'latex',
  CODE = 'code',
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface InventoryData {
  title?: string;
  items: any[];
  totalValue?: number;
  summary?: string;
}

export interface Message {
  id: string;
  content: string;
  messageType: MESSAGE_TYPES;
  isUser: boolean;
  timestamp: string;
  attachments?: MessageAttachment[];
  journalData?: JournalEntry;
  inventoryData?: InventoryData;
  analysisData?: any;
  codeLanguage?: string;
  status?: 'pending' | 'validated' | 'rejected';
}

interface DynamicResponseBuilderProps {
  message: Message;
  onValidate?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onAttach?: (message: Message) => void;
}

const DynamicResponseBuilder: React.FC<DynamicResponseBuilderProps> = ({
  message,
  onValidate,
  onEdit,
  onDelete,
  onAttach,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        {message.attachments.map((att) => (
          <Chip
            key={att.id}
            icon={att.type === 'image' ? 'image' : 'file-document'}
            style={styles.attachmentChip}
          >
            {att.name}
          </Chip>
        ))}
      </View>
    );
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case MESSAGE_TYPES.JOURNAL_ENTRY:
        return (
          <>
            {message.content && <Text style={styles.regularText}>{message.content}</Text>}
            {message.journalData && (
              <JournalEntryCard
                journalEntry={message.journalData}
                status={message.status}
              />
            )}
            {message.status === 'pending' && onValidate && (
              <View style={styles.actionsContainer}>
                <IconButton
                  icon="check-circle"
                  size={20}
                  onPress={() => onValidate(message)}
                  mode="contained"
                  style={styles.actionButton}
                />
              </View>
            )}
          </>
        );
      case MESSAGE_TYPES.INVENTORY:
        return (
          <>
            {message.content && <Text style={styles.regularText}>{message.content}</Text>}
            {message.inventoryData && (
              <InventoryItemList data={message.inventoryData} />
            )}
          </>
        );
      case MESSAGE_TYPES.ANALYSIS:
        return (
          <>
            {message.content && <Text style={styles.regularText}>{message.content}</Text>}
            {message.analysisData && (
              <AnalysisCard analysisData={message.analysisData} />
            )}
          </>
        );
      case MESSAGE_TYPES.MARKDOWN:
        return <MarkdownRenderer content={message.content} />;
      case MESSAGE_TYPES.LATEX:
        return <LatexRenderer content={message.content} />;
      case MESSAGE_TYPES.CODE:
        return <CodeBlock code={message.content} language={message.codeLanguage || 'javascript'} />;
      case MESSAGE_TYPES.REGULAR_CHAT:
      default:
        return <Text style={styles.regularText}>{message.content}</Text>;
    }
  };

  const messageContainerStyle = message.isUser
    ? [styles.messageContainer, styles.userMessage]
    : [styles.messageContainer, styles.aiMessage];

  return (
    <View style={messageContainerStyle}>
      <Card style={styles.card}>
        <Card.Content>
          {renderMessageContent()}
          {renderAttachments()}
        </Card.Content>
      </Card>
      
      <Text style={styles.timestamp}>
        {formatTime(message.timestamp)}
      </Text>
      
      {!message.isUser && (onEdit || onDelete || onAttach) && (
        <View style={styles.actionIcons}>
          {onEdit && (
            <IconButton
              icon="pencil"
              size={16}
              onPress={() => onEdit(message)}
              containerColor={theme.colors.surfaceVariant}
              iconColor={theme.colors.primary}
              style={styles.iconButton}
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size={16}
              onPress={() => onDelete(message)}
              containerColor={theme.colors.surfaceVariant}
              iconColor={theme.colors.error}
              style={styles.iconButton}
            />
          )}
          {onAttach && (
            <IconButton
              icon="paperclip"
              size={16}
              onPress={() => onAttach(message)}
              containerColor={theme.colors.surfaceVariant}
              iconColor={theme.colors.primary}
              style={styles.iconButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  card: {
    borderRadius: 12,
  },
  regularText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  attachmentChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 8,
  },
  actionIcons: {
    flexDirection: 'row',
    position: 'absolute',
    right: -8,
    bottom: -8,
  },
  iconButton: {
    margin: 2,
  },
});

export default DynamicResponseBuilder;
