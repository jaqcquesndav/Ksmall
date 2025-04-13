import { useNavigation, NavigationProp, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { 
  RootStackParamList, 
  MainStackParamList, 
  MainTabsParamList,
  AuthStackParamList
} from '../navigation/types';

// Pour les écrans d'authentification
export function useAuthNavigation() {
  return useNavigation<StackNavigationProp<AuthStackParamList>>();
}

// Pour les écrans dans MainStack
export function useMainNavigation() {
  return useNavigation<StackNavigationProp<MainStackParamList>>();
}

// Pour les écrans dans les onglets principaux
export function useTabNavigation() {
  return useNavigation<CompositeNavigationProp<
    BottomTabNavigationProp<MainTabsParamList>,
    StackNavigationProp<MainStackParamList>
  >>();
}

// Pour une navigation générique qui peut aller partout
export function useAppNavigation() {
  return useNavigation<CompositeNavigationProp<
    StackNavigationProp<RootStackParamList>,
    CompositeNavigationProp<
      StackNavigationProp<MainStackParamList>,
      BottomTabNavigationProp<MainTabsParamList>
    >
  >>();
}
