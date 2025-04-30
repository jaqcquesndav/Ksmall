import 'react-native-paper';
import * as React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';

declare module 'react-native-paper' {
  // Base component props that many components extend
  interface BaseProps {
    style?: StyleProp<ViewStyle>;
    theme?: ReactNativePaper.Theme;
  }
  
  // Common text-based component props
  interface TextBaseProps extends BaseProps {
    children?: React.ReactNode;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
    selectable?: boolean;
    onPress?: () => void;
  }
  
  // Card components
  export interface CardProps extends BaseProps {
    children?: React.ReactNode;
    elevation?: number;
    onPress?: () => void;
    mode?: 'elevated' | 'outlined' | 'contained';
  }
  
  export interface CardContentProps extends BaseProps {
    children?: React.ReactNode;
  }
  
  export interface CardActionsProps extends BaseProps {
    children?: React.ReactNode;
  }
  
  export interface CardCoverProps extends BaseProps {
    children?: React.ReactNode;
    source?: { uri: string } | number;
  }
  
  export interface CardTitleProps extends BaseProps {
    children?: React.ReactNode;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    left?: (props: { size: number }) => React.ReactNode;
    right?: (props: { size: number }) => React.ReactNode;
    leftStyle?: StyleProp<ViewStyle>;
    rightStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    subtitleStyle?: StyleProp<TextStyle>;
  }
  
  // Text components
  export interface TextProps extends TextBaseProps {
    children?: React.ReactNode;
    variant?: string;
  }
  
  export interface TitleProps extends TextBaseProps {
    children?: React.ReactNode;
  }
  
  export interface ParagraphProps extends TextBaseProps {
    children?: React.ReactNode;
  }
  
  export interface HelperTextProps extends TextBaseProps {
    type?: 'error' | 'info';
    visible?: boolean;
    children?: React.ReactNode;
  }
  
  // Button component
  export interface ButtonProps extends BaseProps {
    children?: React.ReactNode;
    mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
    compact?: boolean;
    color?: string;
    loading?: boolean;
    icon?: React.ReactNode | string | { uri: string };
    disabled?: boolean;
    uppercase?: boolean;
    accessibilityLabel?: string;
    onPress?: () => void;
    contentStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    style?: StyleProp<ViewStyle>;
    textColor?: string;
    buttonColor?: string;
  }
  
  // Chip component
  export interface ChipProps extends BaseProps {
    children?: React.ReactNode;
    icon?: React.ReactNode | string | { uri: string };
    avatar?: React.ReactNode;
    selected?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    onClose?: () => void;
    closeIcon?: React.ReactNode | string | { uri: string };
    mode?: 'flat' | 'outlined';
    compact?: boolean;
    elevated?: boolean;
    textStyle?: StyleProp<TextStyle>;
  }
  
  // Menu components
  export interface MenuProps extends BaseProps {
    children?: React.ReactNode;
    visible: boolean;
    onDismiss: () => void;
    anchor: React.ReactNode | { x: number; y: number };
    contentStyle?: StyleProp<ViewStyle>;
    anchorPosition?: 'top' | 'bottom';
  }
  
  export interface MenuItemProps extends BaseProps {
    title: React.ReactNode;
    icon?: React.ReactNode | string | { uri: string };
    disabled?: boolean;
    onPress?: () => void;
    titleStyle?: StyleProp<TextStyle>;
    leadingIcon?: React.ReactNode | string | { uri: string };
    trailingIcon?: React.ReactNode | string | { uri: string };
    contentStyle?: StyleProp<ViewStyle>;
  }
  
  // Appbar components
  export interface AppbarHeaderProps extends BaseProps {
    children?: React.ReactNode;
    dark?: boolean;
    mode?: 'small' | 'medium' | 'large' | 'center-aligned';
    statusBarHeight?: number;
  }
  
  export interface AppbarContentProps extends BaseProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    onPress?: () => void;
    mode?: 'small' | 'medium' | 'large';
    color?: string;
    titleStyle?: StyleProp<TextStyle>;
    subtitleStyle?: StyleProp<TextStyle>;
  }
  
  export interface AppbarActionProps extends BaseProps {
    icon: string | { uri: string } | React.ReactNode;
    onPress?: () => void;
    color?: string;
    disabled?: boolean;
    accessibilityLabel?: string;
    size?: number;
  }
  
  export interface AppbarBackActionProps extends BaseProps {
    onPress?: () => void;
    color?: string;
    disabled?: boolean;
    accessibilityLabel?: string;
    size?: number;
  }
  
  // Overlay components
  export interface ModalProps extends BaseProps {
    children?: React.ReactNode;
    visible: boolean;
    onDismiss: () => void;
    contentContainerStyle?: StyleProp<ViewStyle>;
    dismissable?: boolean;
  }
  
  export interface PortalProps {
    children?: React.ReactNode;
  }
  
  // Other common components
  export interface ActivityIndicatorProps extends BaseProps {
    animating?: boolean;
    color?: string;
    size?: 'small' | 'large' | number;
    hidesWhenStopped?: boolean;
  }
  
  export interface IconButtonProps extends BaseProps {
    icon: string | { uri: string } | React.ReactNode;
    color?: string;
    size?: number;
    disabled?: boolean;
    accessibilityLabel?: string;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    containerColor?: string;
    iconColor?: string;
    mode?: 'outlined' | 'contained' | 'contained-tonal';
  }
  
  export interface TextInputProps extends BaseProps {
    value?: string;
    label?: string;
    mode?: 'flat' | 'outlined';
    disabled?: boolean;
    error?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: string;
    maxLength?: number;
    right?: React.ReactNode;
    left?: React.ReactNode;
    dense?: boolean;
    render?: (props: any) => React.ReactNode;
    underlineColor?: string;
    activeUnderlineColor?: string;
    outlineColor?: string;
    activeOutlineColor?: string;
    textColor?: string;
    selectionColor?: string;
    placeholderTextColor?: string;
    editable?: boolean;
    contentStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
  }
  
  export interface AvatarProps extends BaseProps {
    size?: number;
  }
  
  export interface AvatarIconProps extends AvatarProps {
    icon: string | { uri: string } | React.ReactNode;
    color?: string;
    backgroundColor?: string;
  }
  
  export interface AvatarImageProps extends AvatarProps {
    source: { uri: string } | number;
  }
  
  export interface AvatarTextProps extends AvatarProps {
    label: string;
    labelStyle?: StyleProp<TextStyle>;
    color?: string;
    backgroundColor?: string;
  }
  
  export interface SurfaceProps extends BaseProps {
    children?: React.ReactNode;
    elevation?: number;
    mode?: 'flat' | 'elevated';
  }
  
  export interface RadioButtonProps extends BaseProps {
    value: string;
    status?: 'checked' | 'unchecked';
    disabled?: boolean;
    onPress?: () => void;
    color?: string;
    uncheckedColor?: string;
  }
  
  export interface RadioButtonGroupProps {
    value: string;
    onValueChange: (value: string) => void;
    children?: React.ReactNode;
  }
  
  export interface SwitchProps extends BaseProps {
    value?: boolean;
    disabled?: boolean;
    onValueChange?: (value: boolean) => void;
    color?: string;
  }
  
  export interface DividerProps extends BaseProps {
    bold?: boolean;
    horizontalInset?: boolean;
    leftInset?: boolean;
    rightInset?: boolean;
  }
  
  export interface ListItemProps extends BaseProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    left?: (props: { color: string; style: any }) => React.ReactNode;
    right?: (props: { color: string; style: any }) => React.ReactNode;
    onPress?: () => void;
    titleStyle?: StyleProp<TextStyle>;
    descriptionStyle?: StyleProp<TextStyle>;
    titleNumberOfLines?: number;
    descriptionNumberOfLines?: number;
    disabled?: boolean;
    rippleColor?: string;
  }
  
  export interface ListAccordionProps extends BaseProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    left?: (props: { color: string; style: any }) => React.ReactNode;
    right?: (props: { color: string; style: any }) => React.ReactNode;
    expanded?: boolean;
    onPress?: () => void;
    titleStyle?: StyleProp<TextStyle>;
    descriptionStyle?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    id?: string | number;
  }
  
  export interface ListSectionProps extends BaseProps {
    title?: string;
    titleStyle?: StyleProp<TextStyle>;
    children?: React.ReactNode;
  }
  
  export interface FABProps extends BaseProps {
    icon: string | { uri: string } | React.ReactNode;
    label?: string;
    onPress?: () => void;
    small?: boolean;
    color?: string;
    disabled?: boolean;
    visible?: boolean;
    loading?: boolean;
    uppercase?: boolean;
    mode?: 'flat' | 'elevated';
    labelStyle?: StyleProp<TextStyle>;
    size?: 'small' | 'medium' | 'large';
    iconMode?: 'static' | 'dynamic';
  }
  
  export interface SegmentedButtonsProps extends BaseProps {
    value: string;
    onValueChange: (value: string) => void;
    buttons: Array<{
      value: string;
      label: string;
      icon?: string | { uri: string } | React.ReactNode;
      disabled?: boolean;
      accessibilityLabel?: string;
      onPress?: () => void;
      style?: StyleProp<ViewStyle>;
      showSelectedCheck?: boolean;
      checkedColor?: string;
      uncheckedColor?: string;
    }>;
    multiSelect?: boolean;
    density?: 'regular' | 'small' | 'medium' | 'high';
  }
  
  export interface BadgeProps extends BaseProps {
    visible?: boolean;
    size?: number;
    children?: React.ReactNode;
  }
  
  export interface ProgressBarProps extends BaseProps {
    progress?: number;
    color?: string;
    indeterminate?: boolean;
    visible?: boolean;
  }
  
  // DataTable components
  export interface DataTableProps extends BaseProps {
    children?: React.ReactNode;
  }

  export namespace DataTable {
    interface HeaderProps extends BaseProps {
      children?: React.ReactNode;
    }
    
    interface TitleProps extends BaseProps {
      children?: React.ReactNode;
      numeric?: boolean;
      sortDirection?: 'ascending' | 'descending';
      onPress?: () => void;
      textStyle?: StyleProp<TextStyle>;
    }
    
    interface RowProps extends BaseProps {
      children?: React.ReactNode;
      onPress?: () => void;
      key?: string | number;
    }
    
    interface CellProps extends BaseProps {
      children?: React.ReactNode;
      numeric?: boolean;
      textStyle?: StyleProp<TextStyle>;
    }
    
    interface PaginationProps extends BaseProps {
      page: number;
      numberOfPages: number;
      onPageChange: (page: number) => void;
      label?: string;
      showFastPaginationControls?: boolean;
    }
  }
  
  // Theme components
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
  
  // Additional component namespaces
  export namespace List {
    interface IconProps extends BaseProps {
      icon: string | { uri: string } | React.ReactNode;
      color?: string;
      size?: number;
    }
  }
  
  export namespace Avatar {
    type IconProps = AvatarIconProps;
    type ImageProps = AvatarImageProps;
    type TextProps = AvatarTextProps;
  }
}
