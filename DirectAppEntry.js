// Most minimal possible app registration for Hermes troubleshooting
import React from 'react';
import { AppRegistry, Text, View } from 'react-native';

// Extremely simple component for testing registration
function MinimalApp() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>KSMall App is loading...</Text>
    </View>
  );
}

// Register using named function to ensure proper prototype
AppRegistry.registerComponent('main', function() { return MinimalApp; });
AppRegistry.registerComponent('ksmall', function() { return MinimalApp; });

// Log for debugging
console.log('[DEBUG] Direct minimal app registration complete');

export default MinimalApp;