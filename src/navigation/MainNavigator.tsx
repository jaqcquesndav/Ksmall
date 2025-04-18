import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import MainStack from './MainStack';
import useOrientation from '../hooks/useOrientation';

const Stack = createStackNavigator();

const MainNavigator: React.FC = () => {
  const { isLandscape } = useOrientation();

  return (
    <View style={[
      styles.container,
      isLandscape && styles.containerLandscape
    ]}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: isLandscape ? styles.cardLandscape : styles.card
        }}
      >
        <Stack.Screen name="MainStack" component={MainStack} />
      </Stack.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerLandscape: {
    // Ajustements spécifiques au mode paysage si nécessaire
  },
  card: {
    backgroundColor: '#f5f5f5',
  },
  cardLandscape: {
    backgroundColor: '#f5f5f5',
    // Possibilité d'ajuster les transitions et animations en mode paysage
  },
});

export default MainNavigator;