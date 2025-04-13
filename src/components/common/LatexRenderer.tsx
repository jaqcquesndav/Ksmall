import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

// TODO: Install a LaTeX rendering library compatible with React Native
// Available options:
// - react-native-math-view
// - react-native-mathjax
// npm install react-native-math-view
// or
// npm install react-native-mathjax

interface LatexRendererProps {
  content: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ content }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>
        LaTeX rendering will be available once a compatible library is installed.
      </Text>
      <View style={styles.codeContainer}>
        <Text style={[styles.code, { color: theme.colors.primary }]} selectable>
          {content}
        </Text>
      </View>
    </View>
  );
  
  // Once you integrate a LaTeX library, you can replace the above with something like:
  
  /* Using react-native-mathjax:
  return (
    <MathJax html={content} />
  );
  */
  
  /* Using react-native-math-view:
  return (
    <MathView
      math={content}
      style={{ flex: 1 }}
    />
  );
  */
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  placeholder: {
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#666',
  },
  codeContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  code: {
    fontFamily: 'monospace',
  },
});

export default LatexRenderer;