import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { chatPromptExamples } from '../../utils/chatPromptExamples';
import { CHAT_MODES } from './ModeSelector';

interface ChatPromptSuggestionsProps {
  mode: CHAT_MODES;
  onSelectPrompt: (prompt: string) => void;
}

const ChatPromptSuggestions: React.FC<ChatPromptSuggestionsProps> = ({ mode, onSelectPrompt }) => {
  let examples: string[] = [];
  
  switch (mode) {
    case CHAT_MODES.ACCOUNTING:
      examples = chatPromptExamples.accounting;
      break;
    case CHAT_MODES.INVENTORY:
      examples = chatPromptExamples.inventory;
      break;
    case CHAT_MODES.ANALYSIS:
      examples = chatPromptExamples.analysis;
      break;
    default:
      examples = chatPromptExamples.regular;
  }
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {examples.map((example, index) => (
        <Chip
          key={index}
          mode="outlined"
          style={styles.chip}
          onPress={() => onSelectPrompt(example)}
        >
          {example}
        </Chip>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    marginRight: 8,
  },
});

export default ChatPromptSuggestions;
