import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ThemeContext } from '../context/ThemeContext';
import * as Linking from 'expo-linking';

interface MarkdownDisplayProps {
  content: string;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content }) => {
  const { theme } = useContext(ThemeContext);

  const markdownStyles = {
    body: {
      color: theme.colors.text,
      fontSize: 16,
    },
    heading1: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 12,
    },
    heading2: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: 'bold',
      marginVertical: 10,
    },
    heading3: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    heading4: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    heading5: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    heading6: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    paragraph: {
      color: theme.colors.text,
      fontSize: 16,
      marginVertical: 8,
    },
    link: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    blockquote: {
      backgroundColor: theme.colors.card,
      borderLeftColor: theme.colors.primary,
      borderLeftWidth: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginVertical: 10,
    },
    inlineCode: {
      backgroundColor: theme.colors.card,
      color: theme.colors.primary,
      borderRadius: 4,
      paddingHorizontal: 5,
      fontFamily: 'Courier',
      fontSize: 14,
    },
    code_block: {
      backgroundColor: theme.dark ? '#282c34' : '#f5f5f5',
      padding: 10,
      borderRadius: 8,
      fontSize: 14,
      fontFamily: 'Courier',
      marginVertical: 10,
    },
    list_item: {
      color: theme.colors.text,
      fontSize: 16,
      marginVertical: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    hr: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginVertical: 16,
    },
    image: {
      alignSelf: 'center',
      borderRadius: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      marginVertical: 10,
      overflow: 'hidden',
    },
    thead: {
      backgroundColor: theme.colors.card,
    },
    th: {
      padding: 10,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
    },
    tr: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    td: {
      padding: 8,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
    },
  };

  const onLinkPress = (url: string) => {
    Linking.openURL(url);
    return false; // Prevents default behavior
  };

  return (
    <View style={styles.container}>
      <Markdown
        style={markdownStyles}
        onLinkPress={onLinkPress}
      >
        {content}
      </Markdown>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MarkdownDisplay;
