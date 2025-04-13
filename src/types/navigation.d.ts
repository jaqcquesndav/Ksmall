declare module '@react-navigation/native-stack' {
  import { ParamListBase } from '@react-navigation/native';
  
  export type NativeStackNavigationProp<
    ParamList extends ParamListBase,
    RouteName extends keyof ParamList = string
  > = {
    navigate<RouteName extends keyof ParamList>(
      ...args: 
        | [screen: RouteName]
        | [screen: RouteName, params: ParamList[RouteName]]
    ): void;
    reset(state: any): void;
    goBack(): void;
    dispatch(action: any): void;
    setParams(params: Partial<ParamList[RouteName]>): void;
    // Add other navigation methods as needed
  };

  export type NativeStackScreenProps<
    ParamList extends ParamListBase,
    RouteName extends keyof ParamList = string
  > = {
    navigation: NativeStackNavigationProp<ParamList, RouteName>;
    route: {
      key: string;
      name: RouteName;
      params: ParamList[RouteName];
    };
  };

  export function createNativeStackNavigator(): {
    Navigator: React.ComponentType<any>;
    Screen: React.ComponentType<any>;
  };
}
