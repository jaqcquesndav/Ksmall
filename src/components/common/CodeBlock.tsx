import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'plaintext' }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    alert(t('code_copied'));
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={[styles.languageLabel, { color: theme.colors.onSurfaceVariant }]}>
            {language}
          </Text>
          <IconButton 
            icon="content-copy" 
            size={20}
            onPress={copyToClipboard}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>
        <ScrollView horizontal style={styles.codeScrollView}>
          <Text style={[styles.codeText, { color: theme.colors.onSurfaceVariant }]}>
            {code}
          </Text>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  codeScrollView: {
    maxHeight: 300,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 14,
    padding: 8,
  },
});

export default CodeBlock;
