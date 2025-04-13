import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';

const ReportGeneratorScreen: React.FC = () => {
  const navigation = useNavigation();
  
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Rapports Comptables" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Générateur de rapports en construction</Text>
      </View>
    </View>
  );
};

export default ReportGeneratorScreen;
