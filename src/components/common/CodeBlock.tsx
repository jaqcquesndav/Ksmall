import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.container}>
      <Card.Content style={{ padding: 0 }}>
        <View style={styles.header}>
          <Text style={styles.language}>{language}</Text>
        </View>
        <ScrollView horizontal style={styles.scrollContainer}>
          <ScrollView nestedScrollEnabled style={styles.codeContainer}>
            <Text style={[styles.code, { color: theme.colors.onSurface }]}>
              {code}
            </Text>
          </ScrollView>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  language: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  scrollContainer: {
    maxHeight: 300,
  },
  codeContainer: {
    padding: 12,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CodeBlock;
