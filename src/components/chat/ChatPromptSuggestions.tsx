
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { CHAT_MODES } from './ModeSelector';

interface ChatPromptSuggestionsProps {
  mode: CHAT_MODES;
  onSelectPrompt: (prompt: string) => void;
}

// Example prompts for different chat modes
const chatPromptExamples = {
  [CHAT_MODES.REGULAR]: [
    "What's the total value of my current inventory?",
    "Show me a summary of this month's sales",
    "What steps should I take to improve my business's cash flow?",
    "How can I optimize my inventory management?"
  ],
  [CHAT_MODES.ACCOUNTING]: [
    "Create a journal entry for a $5,000 equipment purchase paid by bank transfer",
    "Record a sales transaction of $1,200 with 16% VAT",
    "Make a journal entry for paying salaries of $3,500",
    "Record monthly rent payment of $800"
  ],
  [CHAT_MODES.INVENTORY]: [
    "Add 10 new HP laptops at $450 each",
    "Update Samsung Galaxy A53 stock to 15 units",
    "Create a purchase order for 20 Logitech keyboards",
    "Show me products with low stock"
  ],
  [CHAT_MODES.ANALYSIS]: [
    "Analyze my business profitability for the last quarter",
    "Compare revenue between this month and last month",
    "What are my top selling products?",
    "Generate a cash flow forecast for next month"
  ]
};

const ChatPromptSuggestions: React.FC<ChatPromptSuggestionsProps> = ({ mode, onSelectPrompt }) => {
  const examples = chatPromptExamples[mode] || chatPromptExamples[CHAT_MODES.REGULAR];
  
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
