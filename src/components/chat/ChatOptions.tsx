import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Message } from './DynamicResponseBuilder';

interface ChatOptionsProps {
  message: Message;
  onClose: () => void;
  onUpdate: (updatedMessage: Message) => void;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({ message, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [editedContent, setEditedContent] = useState(message.content);

  const handleSave = () => {
    if (editedContent !== message.content) {
      onUpdate({
        ...message,
        content: editedContent,
      });
    } else {
      onClose();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('edit_message')}</Text>
      
      <TextInput
        value={editedContent}
        onChangeText={setEditedContent}
        multiline
        style={styles.input}
        mode="outlined"
      />
      
      <View style={styles.buttonContainer}>
        <Button
          mode="text"
          onPress={onClose}
          style={styles.button}
        >
          {t('cancel')}
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          disabled={editedContent === message.content}
        >
          {t('save')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: 8,
  },
});

export default ChatOptions;
