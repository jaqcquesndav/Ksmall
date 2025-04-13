import 'react-native-paper';
import * as React from 'react';

declare module 'react-native-paper' {
  // Composants principaux avec la propriété children obligatoire
  export interface CardProps {
    children?: React.ReactNode;
  }
  
  export interface CardContentProps {
    children?: React.ReactNode;
  }
  
  export interface CardActionsProps {
    children?: React.ReactNode;
  }
  
  export interface CardCoverProps {
    children?: React.ReactNode;
  }
  
  export interface CardTitleProps {
    children?: React.ReactNode;
  }
  
  export interface TextProps {
    children?: React.ReactNode;
  }
  
  export interface ButtonProps {
    children?: React.ReactNode;
    contentStyle?: any;
    labelStyle?: any;
  }
  
  export interface ChipProps {
    children?: React.ReactNode;
  }
  
  export interface TitleProps {
    children?: React.ReactNode;
  }
  
  export interface ParagraphProps {
    children?: React.ReactNode;
  }
  
  export interface MenuProps {
    children?: React.ReactNode;
    contentStyle?: any;
    anchor?: any;
  }
  
  export interface MenuItemProps {
    title?: React.ReactNode;
    children?: React.ReactNode;
  }
  
  export interface AppbarHeaderProps {
    children?: React.ReactNode;
  }
  
  export interface AppbarContentProps {
    title?: React.ReactNode;
    children?: React.ReactNode;
  }
  
  export interface AppbarActionProps {
    icon: string | { uri: string } | React.ReactNode;
    children?: React.ReactNode;
  }
  
  export interface ModalProps {
    children?: React.ReactNode;
    contentContainerStyle?: any;
  }
  
  export interface PortalProps {
    children?: React.ReactNode;
  }
  
  export interface ActivityIndicatorProps {
    animating?: boolean;
    color?: string;
    size?: 'small' | 'large' | number;
    children?: React.ReactNode;
  }
  
  export interface IconButtonProps {
    icon: string | { uri: string } | React.ReactNode;
    color?: string;
    size?: number;
    disabled?: boolean;
    accessibilityLabel?: string;
    onPress?: () => void;
    style?: any;
    children?: React.ReactNode;
    containerColor?: string;
    iconColor?: string;
    mode?: 'outlined' | 'contained' | 'contained-tonal';
  }
  
  export interface HelperTextProps {
    type?: 'error' | 'info';
    visible?: boolean;
    children?: React.ReactNode;
  }
  
  export interface TextInputProps {
    children?: React.ReactNode;
    right?: React.ReactNode;
    left?: React.ReactNode;
  }
  
  export interface DataTableProps {
    children?: React.ReactNode;
  }
  
  export interface DataTableCellProps {
    children?: React.ReactNode;
  }
  
  // Les types pour les composants imbriqués comme DataTable.Cell, etc.
  export namespace DataTable {
    interface HeaderProps {
      children?: React.ReactNode;
    }
    
    interface TitleProps {
      children?: React.ReactNode;
      numeric?: boolean;
    }
    
    interface RowProps {
      children?: React.ReactNode;
      onPress?: () => void;
      style?: any;
      key?: string | number;
    }
    
    interface CellProps {
      children?: React.ReactNode;
      numeric?: boolean;
    }
  }
  
  // Composants de thème
  export const MD3DarkTheme: ReactNativePaper.Theme;
  export const DefaultTheme: ReactNativePaper.Theme;
  
  export interface ThemeProviderProps {
    children?: React.ReactNode;
    theme?: ReactNativePaper.Theme;
  }
  
  export interface PaperProviderProps {
    children?: React.ReactNode;
    theme?: ReactNativePaper.Theme;
  }
}
