import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  TextInput,
  IconButton,
  Chip,
  Menu,
  Portal,
  Modal,
  ActivityIndicator
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import Speech from '../../utils/SpeechHelper';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useMainNavigation } from '../../hooks/useAppNavigation';
import { MainStackParamList } from '../../navigation/types';

import DynamicResponseBuilder, {
  MESSAGE_TYPES,
  Message
} from '../../components/chat/DynamicResponseBuilder';
import ModeSelector, { CHAT_MODES } from '../../components/chat/ModeSelector';
import ChatOptions from '../../components/chat/ChatOptions';
import ChatPromptSuggestions from '../../components/chat/ChatPromptSuggestions';
import VoiceInputModal from '../../components/chat/VoiceInputModal';
import { JournalEntry } from '../../components/accounting/DynamicJournalEntryWidget';
import { InventoryData } from '../../components/chat/DynamicResponseBuilder';
import AIBackendService from '../../services/AIBackendService';
import ConversationService, { Conversation } from '../../services/ConversationService';
import { generateUniqueId } from '../../utils/helpers';
import { formatTime } from '../../utils/formatters';
import logger from '../../utils/logger';
import { showErrorToUser } from '../../utils/errorHandler';
import AppHeader from '../../components/common/AppHeader';
import ConversationHistory from '../../components/chat/ConversationHistory';

// Define the route param type
type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useMainNavigation();
  const route = useRoute<ChatScreenRouteProp>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{uri: string, type: string, name: string}[]>([]);
  const [chatMode, setChatMode] = useState<CHAT_MODES>(CHAT_MODES.REGULAR);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    logger.info('ChatScreen monté');
    
    const loadConversation = async () => {
      if (route?.params?.conversationId) {
        const conversation = await ConversationService.getConversationById(route.params.conversationId);
        if (conversation) {
          setCurrentConversation(conversation);
          setChatMode(conversation.mode);
          setMessages(conversation.messages);
          return;
        }
      }

      if (messages.length === 0) {
        logger.debug('Initialisation du message de bienvenue');
        const welcomeMessage: Message = {
          id: generateUniqueId(),
          content: t('welcome_message'),
          messageType: MESSAGE_TYPES.REGULAR_CHAT,
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        
        const newConversation = await ConversationService.createConversation(chatMode, welcomeMessage);
        setCurrentConversation(newConversation);
      }
    };
    
    loadConversation();
    
    return () => {
      logger.info('ChatScreen démonté');
    };
  }, [route?.params?.conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    const userMessageText = inputText.trim();
    setInputText('');
    
    logger.debug('Envoi du message utilisateur', { content: userMessageText, attachments: attachments.length });

    const userMessage: Message = {
      id: generateUniqueId(),
      content: userMessageText,
      messageType: MESSAGE_TYPES.REGULAR_CHAT,
      isUser: true,
      timestamp: new Date().toISOString(),
      attachments: attachments.map(att => ({
        id: generateUniqueId(),
        name: att.name,
        type: att.type.includes('image') ? 'image' : 'document',
        url: att.uri
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setAttachments([]);
    setIsLoading(true);

    try {
      if (currentConversation) {
        await ConversationService.addMessage(currentConversation.id, userMessage);
      }

      logger.info('Appel de l\'API IA', { mode: chatMode });
      const response = await AIBackendService.processUserInput({
        text: userMessageText,
        attachments: userMessage.attachments || [],
        mode: chatMode
      });
      
      logger.debug('Réponse reçue de l\'API', { responseType: response.type });

      const aiResponse = createResponseMessage(response);
      setMessages(prev => [...prev, aiResponse]);

      if (currentConversation) {
        await ConversationService.addMessage(currentConversation.id, aiResponse);
      }
    } catch (error) {
      logger.error('Erreur lors du traitement du message', error);
      showErrorToUser('Une erreur s\'est produite lors du traitement de votre message.', error);
      
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: t('error_message'),
        messageType: MESSAGE_TYPES.REGULAR_CHAT,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

      if (currentConversation) {
        await ConversationService.addMessage(currentConversation.id, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createResponseMessage = (response: any): Message => {
    let messageType = MESSAGE_TYPES.REGULAR_CHAT;

    if (response.type === 'journal_entry') {
      messageType = MESSAGE_TYPES.JOURNAL_ENTRY;
    } else if (response.type === 'inventory') {
      messageType = MESSAGE_TYPES.INVENTORY;
    } else if (response.type === 'analysis') {
      messageType = MESSAGE_TYPES.ANALYSIS;
    } else if (response.format === 'markdown') {
      messageType = MESSAGE_TYPES.MARKDOWN;
    } else if (response.format === 'latex') {
      messageType = MESSAGE_TYPES.LATEX;
    } else if (response.format === 'code') {
      messageType = MESSAGE_TYPES.CODE;
    }

    const message: Message = {
      id: generateUniqueId(),
      content: response.content || '',
      messageType,
      isUser: false,
      timestamp: new Date().toISOString(),
      status: response.status || 'pending'
    };

    if (messageType === MESSAGE_TYPES.JOURNAL_ENTRY) {
      message.journalData = response.data as JournalEntry;
    } else if (messageType === MESSAGE_TYPES.INVENTORY) {
      message.inventoryData = response.data as InventoryData;
    } else if (messageType === MESSAGE_TYPES.ANALYSIS) {
      message.analysisData = response.data;
    } else if (messageType === MESSAGE_TYPES.CODE) {
      message.codeLanguage = response.language || 'javascript';
    }

    return message;
  };

  const handleAddImage = async () => {
    try {
      logger.debug('Demande d\'accès à la bibliothèque d\'images');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        logger.warn('Permission d\'accès à la bibliothèque d\'images refusée');
        showErrorToUser(t('permissions_required'));
        return;
      }

      logger.debug('Ouverture du sélecteur d\'images');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      logger.debug('Résultat de la sélection d\'image', { canceled: result.canceled });
      if (!result.canceled) {
        const asset = result.assets[0];
        const name = asset.uri.split('/').pop() || 'image.jpg';

        logger.info('Image sélectionnée', { name, uri: asset.uri });
        setAttachments(prev => [...prev, {
          uri: asset.uri,
          type: 'image/jpeg',
          name
        }]);
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection d\'image', error);
      showErrorToUser('Une erreur s\'est produite lors de la sélection de l\'image.', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert(t('camera_permission_required'));
        return;
      }
      
      // More robust error handling for the camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = `photo_${Date.now()}.jpg`;
        
        setAttachments(prev => [...prev, {
          uri: asset.uri,
          type: 'image/jpeg',
          name
        }]);
      }
    } catch (error) {
      logger.error('Error taking photo', error);
      showErrorToUser(t('error_camera'));
    }
  };

  const handleAddDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });

    if (result.type !== "cancel") {
      setAttachments(prev => [...prev, {
        uri: result.uri,
        type: result.mimeType || 'application/octet-stream',
        name: result.name || 'document'
      }]);
    }
  };

  const handleVoiceMode = () => {
    setShowVoiceModal(true);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        await recording?.stopAndUnloadAsync();
        const uri = recording?.getURI();
        if (uri) {
          setAttachments(prev => [...prev, {
            uri,
            type: 'audio/m4a',
            name: `audio_${Date.now()}.m4a`
          }]);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      setRecording(null);
    } else {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(recording);
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  };

  const handleValidateMessage = async (message: Message) => {
    try {
      await AIBackendService.validateEntry({
        id: message.id,
        type: message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY ? 'journal_entry' : 'inventory',
        data: message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY ? message.journalData : message.inventoryData
      });
      
      const updatedMessage = { ...message, status: 'validated' as const };
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id ? updatedMessage : msg
        )
      );
      
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          messages: currentConversation.messages.map(msg =>
            msg.id === message.id ? updatedMessage : msg
          )
        };
        await ConversationService.updateConversation(updatedConversation);
      }
    } catch (error) {
      logger.error('Erreur lors de la validation du message', error);
      showErrorToUser('Erreur lors de la validation', error);
    }
  };

  const handleEditMessage = async (message: Message) => {
    setSelectedMessage(message);
    setShowOptionsModal(true);
  };

  const handleDeleteMessage = async (message: Message) => {
    try {
      const updatedMessages = messages.filter(msg => msg.id !== message.id);
      setMessages(updatedMessages);
      
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          messages: currentConversation.messages.filter(msg => msg.id !== message.id)
        };
        await ConversationService.updateConversation(updatedConversation);
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression du message', error);
      showErrorToUser('Erreur lors de la suppression', error);
    }
  };

  const handleAttachToMessage = (message: Message) => {
    setSelectedMessage(message);
    handleAddDocument();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewConversation = async () => {
    try {
      const welcomeMessage: Message = {
        id: generateUniqueId(),
        content: t('welcome_message'),
        messageType: MESSAGE_TYPES.REGULAR_CHAT,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      const newConversation = await ConversationService.createConversation(CHAT_MODES.REGULAR, welcomeMessage);
      setCurrentConversation(newConversation);
      setChatMode(CHAT_MODES.REGULAR);
      setMessages([welcomeMessage]);
    } catch (error) {
      logger.error('Erreur lors de la création d\'une nouvelle conversation', error);
      showErrorToUser('Erreur lors de la création d\'une nouvelle conversation', error);
    }
  };

  const handleNavigateToHistory = () => {
    setShowHistoryModal(true);
  };

  const renderAttachments = () => {
    if (attachments.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        {attachments.map((item, index) => (
          <Chip
            key={`attachment-${index}`}
            icon={item.type.includes('image') ? 'image' : item.type.includes('audio') ? 'microphone' : 'file-document'}
            onClose={() => handleRemoveAttachment(index)}
            style={styles.attachmentChip}
          >
            {item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name}
          </Chip>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AppHeader title={t('ksmall_assistant')} />

      <View style={styles.topBar}>
        <ModeSelector
          currentMode={chatMode}
          onChangeMode={setChatMode}
        />
        <View style={styles.actionButtons}>
          <IconButton
            icon="clock-outline"
            size={24}
            onPress={handleNavigateToHistory}
            style={styles.actionButton}
          />
          <IconButton
            icon="plus-circle-outline"
            size={24}
            onPress={handleNewConversation}
            style={styles.actionButton}
          />
        </View>
      </View>

      <ChatPromptSuggestions 
        mode={chatMode} 
        onSelectPrompt={(prompt) => {
          setInputText(prompt);
        }} 
      />

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        renderItem={({ item }) => (
          <DynamicResponseBuilder
            message={item}
            onValidate={handleValidateMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onAttach={handleAttachToMessage}
          />
        )}
        ListFooterComponent={isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
          </View>
        ) : null}
        ref={flatListRef}
      />

      {renderAttachments()}

      <View style={styles.inputContainer}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={handleAddDocument}
        />
        <IconButton
          icon="camera"
          size={24}
          onPress={handleTakePhoto}
        />
        <TextInput
          style={styles.input}
          placeholder={t('type_message')}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        
        {inputText.trim() ? (
          <IconButton
            icon="send"
            size={24}
            onPress={handleSendMessage}
            disabled={isLoading}
          />
        ) : (
          <IconButton
            icon="microphone"
            size={24}
            onPress={handleVoiceMode}
            disabled={isLoading}
          />
        )}
      </View>

      <Portal>
        <Modal
          visible={showOptionsModal}
          onDismiss={() => setShowOptionsModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedMessage && (
            <ChatOptions
              message={selectedMessage}
              onClose={() => setShowOptionsModal(false)}
              onUpdate={(updatedMessage) => {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                  )
                );
                setShowOptionsModal(false);
              }}
            />
          )}
        </Modal>

        <Modal
          visible={showVoiceModal}
          onDismiss={() => setShowVoiceModal(false)}
          contentContainerStyle={styles.voiceModalContainer}
        >
          <VoiceInputModal 
            onClose={() => setShowVoiceModal(false)}
            onMessageSent={(message) => {
              setShowVoiceModal(false);
              setInputText(message);
              setTimeout(() => {
                handleSendMessage();
              }, 100);
            }}
            chatMode={chatMode}
          />
        </Modal>

        <Modal
          visible={showHistoryModal}
          onDismiss={() => setShowHistoryModal(false)}
          contentContainerStyle={styles.historyModalContainer}
        >
          <ConversationHistory 
            onSelectConversation={(conversation) => {
              setCurrentConversation(conversation);
              setChatMode(conversation.mode);
              setMessages(conversation.messages);
              setShowHistoryModal(false);
            }}
            onClose={() => setShowHistoryModal(false)}
          />
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
    backgroundColor: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
  },
  attachmentChip: {
    margin: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  voiceModalContainer: {
    backgroundColor: 'white',
    margin: 0,
    padding: 0,
    flex: 1,
    width: '100%',
    height: '100%',
  },
  historyModalContainer: {
    backgroundColor: 'white',
    margin: 0,
    padding: 0,
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default ChatScreen;
