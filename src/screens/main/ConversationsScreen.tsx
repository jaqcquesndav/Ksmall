import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { List, Text, IconButton, Divider, FAB, Chip } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import ConversationService, { Conversation } from '../../services/ConversationService';
import { showErrorToUser } from '../../utils/errorHandler';
import logger from '../../utils/logger';
import AppHeader from '../../components/common/AppHeader';
import { CHAT_MODES } from '../../components/chat/ModeSelector';

// Define the navigation param type
type RootStackParamList = {
  Chat: { conversationId?: string; newConversation?: boolean };
  Conversations: undefined;
  // Add other screens as needed
};

type NavigationProps = NavigationProp<RootStackParamList>;

const ConversationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await ConversationService.getConversations();
      setConversations(data);
    } catch (error) {
      logger.error('Erreur lors du chargement des conversations', error);
      showErrorToUser('Erreur lors du chargement des conversations', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    // Rafraîchir la liste lorsque l'écran est focalisé
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [navigation]);

  const handleDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      t('delete_conversation'),
      t('delete_conversation_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ConversationService.deleteConversation(conversation.id);
              loadConversations();
            } catch (error) {
              logger.error(`Erreur lors de la suppression de la conversation ${conversation.id}`, error);
              showErrorToUser('Erreur lors de la suppression', error);
            }
          }
        }
      ]
    );
  };

  const getModeIcon = (mode: CHAT_MODES) => {
    switch (mode) {
      case CHAT_MODES.ACCOUNTING:
        return 'calculator';
      case CHAT_MODES.INVENTORY:
        return 'package-variant';
      case CHAT_MODES.ANALYSIS:
        return 'chart-bar';
      default:
        return 'chat';
    }
  };

  const getModeColor = (mode: CHAT_MODES) => {
    switch (mode) {
      case CHAT_MODES.ACCOUNTING:
        return '#2196F3';
      case CHAT_MODES.INVENTORY:
        return '#4CAF50';
      case CHAT_MODES.ANALYSIS:
        return '#FF9800';
      default:
        return '#9C27B0';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
    >
      <List.Item
        title={item.title}
        description={item.preview}
        left={props => <List.Icon {...props} icon={getModeIcon(item.mode)} color={getModeColor(item.mode)} />}
        right={props => (
          <View style={styles.itemActions}>
            <Text style={styles.timeText}>{formatDate(item.lastUpdated)}</Text>
            <IconButton
              {...props}
              icon="delete" 
              size={20} 
              onPress={() => handleDeleteConversation(item)}
            />
          </View>
        )}
      />
      <Divider />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title={t('conversations')} />
      
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('no_conversations')}</Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={loadConversations}
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Chat', { newConversation: true })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    flexGrow: 1,
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
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ConversationsScreen;
