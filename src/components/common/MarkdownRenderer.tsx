import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import SimpleMarkdown from 'simple-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const theme = useTheme();
  
  // Define custom rules for rendering markdown elements
  const rules = {
    // Handle paragraphs
    paragraph: {
      match: SimpleMarkdown.blockRegex(/^((?:[^\n]|\n(?! *\n))+)(?:\n *)+/),
      render: (node: any, output: any) => (
        <View key={node.key} style={styles.paragraph}>
          <Text>{output(node.content)}</Text>
        </View>
      )
    },
    
    // Handle headings h1-h6
    heading: {
      match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/),
      render: (node: any, output: any) => {
        const headingLevel = node.level;
        let fontSize;
        switch (headingLevel) {
          case 1: fontSize = 24; break;
          case 2: fontSize = 20; break;
          case 3: fontSize = 18; break;
          case 4: fontSize = 16; break;
          case 5: fontSize = 14; break;
          case 6: fontSize = 12; break;
          default: fontSize = 24;
        }
        return (
          <View key={node.key} style={[styles.heading, { marginTop: headingLevel === 1 ? 10 : 8 }]}>
            <Text style={{ fontSize, fontWeight: 'bold', color: theme.colors.primary }}>
              {output(node.content)}
            </Text>
          </View>
        );
      }
    },
    
    // Handle text styling
    text: {
      match: SimpleMarkdown.anyScopeRegex(/^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff]|\n\n| {2,}\n|\w+:\S|$)/),
      render: (node: any) => <Text key={node.key}>{node.content}</Text>
    },
    
    // Handle strong/bold text
    strong: {
      match: SimpleMarkdown.inlineRegex(/^\*\*([\s\S]+?)\*\*(?!\*)/),
      render: (node: any, output: any) => (
        <Text key={node.key} style={{ fontWeight: 'bold' }}>
          {output(node.content)}
        </Text>
      )
    },
    
    // Handle em/italic text
    em: {
      match: SimpleMarkdown.inlineRegex(/^\*((?:\*\*|[\s\S])+?)\*(?!\*)/),
      render: (node: any, output: any) => (
        <Text key={node.key} style={{ fontStyle: 'italic' }}>
          {output(node.content)}
        </Text>
      )
    },
    
    // Handle links
    link: {
      match: SimpleMarkdown.inlineRegex(/^\[([^\]]*)\]\(([^)]+)\)/),
      render: (node: any, output: any) => (
        <Text 
          key={node.key} 
          style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(node.target)}
        >
          {output(node.content)}
        </Text>
      )
    },
    
    // Handle lists
    list: {
      match: SimpleMarkdown.blockRegex(/^( *)((?:[*+-]|\d+\.)) [\s\S]+?(?:\n+(?=\S)(!?(?:[*+-]|\d+\.) )|\n+$)/),
      render: (node: any, output: any) => (
        <View key={node.key} style={styles.list}>
          {output(node.items)}
        </View>
      )
    },
    
    // Handle list items
    listItem: {
      match: SimpleMarkdown.blockRegex(/^( *)((?:[*+-]|\d+\.)) [\s\S]+?(?:\n+(?=\S)(!?(?:[*+-]|\d+\.) )|\n+$)/),
      render: (node: any, output: any) => (
        <View key={node.key} style={styles.listItem}>
          <Text>• </Text>
          <View style={styles.listItemContent}>
            {output(node.content)}
          </View>
        </View>
      )
    },
  };
  
  // Create parser and renderer using our custom rules
  const parser = SimpleMarkdown.parserFor(rules);
  const renderer = SimpleMarkdown.reactFor(SimpleMarkdown.ruleOutput(rules));
  
  // Parse the markdown content
  const parsedContent = parser(content, { inline: false });
  
  // Render the parsed content
  return <View style={styles.container}>{renderer(parsedContent)}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  paragraph: {
    marginBottom: 10,
  },
  heading: {
    marginBottom: 8,
  },
  list: {
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 8,
  },
  listItemContent: {
    flex: 1,
  },
});

export default MarkdownRenderer;