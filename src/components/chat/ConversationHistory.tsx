import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Appbar, List, Text, Divider, IconButton, ActivityIndicator, Button } from 'react-native-paper';
import ConversationService, { Conversation } from '../../services/ConversationService';
import { CHAT_MODES } from './ModeSelector';
import logger from '../../utils/logger';
import { showErrorToUser } from '../../utils/errorHandler';

interface ConversationHistoryProps {
  onSelectConversation: (conversation: Conversation) => void;
  onClose: () => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ onSelectConversation, onClose }) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await ConversationService.getConversations();
      setConversations(data);
    } catch (error) {
      logger.error('Erreur lors du chargement des conversations', error);
      showErrorToUser('Erreur lors du chargement des conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await ConversationService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (error) {
      logger.error('Erreur lors de la suppression de la conversation', error);
      showErrorToUser('Erreur lors de la suppression');
    }
  };

  const getModeIcon = (mode: CHAT_MODES) => {
    switch (mode) {
      case CHAT_MODES.ACCOUNTING:
        return 'calculator-variant';
      case CHAT_MODES.INVENTORY:
        return 'package-variant-closed';
      case CHAT_MODES.ANALYSIS:
        return 'chart-bar';
      default:
        return 'chat';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={onClose} />
        <Appbar.Content title={t('conversation_history')} />
        <Appbar.Action icon="refresh" onPress={loadConversations} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('no_conversations')}</Text>
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.button}
          >
            {t('start_new_conversation')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onSelectConversation(item)}>
              <List.Item
                title={item.title}
                description={`${item.preview?.substring(0, 50)}${item.preview?.length > 50 ? '...' : ''}`}
                left={props => <List.Icon {...props} icon={getModeIcon(item.mode)} />}
                right={props => (
                  <View style={styles.itemRight}>
                    <Text style={styles.dateText}>{formatDate(item.lastUpdated)}</Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(item.id);
                      }}
                    />
                  </View>
                )}
              />
              <Divider />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  button: {
    marginTop: 20,
  },
});

export default ConversationHistory;
