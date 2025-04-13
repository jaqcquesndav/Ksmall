import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  TextInput,
  IconButton,
  Chip,
  Menu,
  Appbar,
  Portal,
  Modal,
  ActivityIndicator
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

import DynamicResponseBuilder, {
  MESSAGE_TYPES,
  Message
} from '../../components/chat/DynamicResponseBuilder';
import ModeSelector, { CHAT_MODES } from '../../components/chat/ModeSelector';
import ChatOptions from '../../components/chat/ChatOptions';
import ChatPromptSuggestions from '../../components/chat/ChatPromptSuggestions';
import { JournalEntry } from '../../components/accounting/DynamicJournalEntryWidget';
import { InventoryData } from '../../components/chat/DynamicResponseBuilder';
import AIBackendService from '../../services/AIBackendService';
import { generateUniqueId } from '../../utils/helpers';
import { formatTime } from '../../utils/formatters';
import logger from '../../utils/logger';
import { showErrorToUser } from '../../utils/errorHandler';
import AppHeader from '../../components/common/AppHeader';

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{uri: string, type: string, name: string}[]>([]);
  const [chatMode, setChatMode] = useState<CHAT_MODES>(CHAT_MODES.REGULAR);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    logger.info('ChatScreen monté');
    
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
    }
    
    return () => {
      logger.info('ChatScreen démonté');
    };
  }, []);

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
      logger.info('Appel de l\'API IA', { mode: chatMode });
      const response = await AIBackendService.processUserInput({
        text: userMessageText,
        attachments: userMessage.attachments || [],
        mode: chatMode
      });
      
      logger.debug('Réponse reçue de l\'API', { responseType: response.type });

      const aiResponse = createResponseMessage(response);
      setMessages(prev => [...prev, aiResponse]);
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
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert(t('camera_permission_required'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const name = `photo_${Date.now()}.jpg`;

      setAttachments(prev => [...prev, {
        uri: asset.uri,
        type: 'image/jpeg',
        name
      }]);
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

  const handleValidateMessage = (message: Message) => {
    AIBackendService.validateEntry({
      id: message.id,
      type: message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY ? 'journal_entry' : 'inventory',
      data: message.messageType === MESSAGE_TYPES.JOURNAL_ENTRY ? message.journalData : message.inventoryData
    }).then(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id ? { ...msg, status: 'validated' } : msg
        )
      );
    });
  };

  const handleEditMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowOptionsModal(true);
  };

  const handleDeleteMessage = (message: Message) => {
    setMessages(prev => prev.filter(msg => msg.id !== message.id));
  };

  const handleAttachToMessage = (message: Message) => {
    setSelectedMessage(message);
    handleAddDocument();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

      <ModeSelector
        currentMode={chatMode}
        onChangeMode={setChatMode}
      />

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
        <IconButton
          icon={isRecording ? "stop-circle-outline" : "microphone"}
          size={24}
          iconColor={isRecording ? "#FF3B30" : undefined}
          onPress={handleToggleRecording}
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSendMessage}
          disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
        />
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
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

export default ChatScreen;
