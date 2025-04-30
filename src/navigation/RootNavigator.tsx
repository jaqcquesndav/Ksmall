import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/common/LoadingScreen';
import { RootStackParamList } from './types';
import SyncStatusIndicator from '../components/common/SyncStatusIndicator';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing || loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <AppNavigator />
      <SyncStatusIndicator />
    </>
  );
};

export default RootNavigator;
