import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';

const JournalEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Journal Comptable" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Journal comptable en construction</Text>
      </View>
    </View>
  );
};

export default JournalEntryScreen;
