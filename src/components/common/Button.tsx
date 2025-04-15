import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const theme = useTheme();
  
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.card;
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };
  
  const getBorderColor = () => {
    if (disabled) return theme.colors.border;
    
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      default:
        return 'transparent';
    }
  };
  
  const getTextColor = () => {
    if (disabled) return theme.colors.text + '80';
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.primary;
      default:
        return '#FFFFFF';
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'medium':
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      default:
        return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        getPadding(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

export default Button;