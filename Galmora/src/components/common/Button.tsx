import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base, styles[size]];

    switch (variant) {
      case 'primary':
        list.push(styles.primary);
        break;
      case 'secondary':
        list.push(styles.secondary);
        break;
      case 'outline':
        list.push(styles.outline);
        break;
      case 'ghost':
        list.push(styles.ghost);
        break;
      case 'whatsapp':
        list.push(styles.whatsapp);
        break;
      case 'danger':
        list.push(styles.danger);
        break;
    }

    if (disabled || loading) {
      list.push(styles.disabled);
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.textBase, styles[`text_${size}` as keyof typeof styles] as TextStyle];

    switch (variant) {
      case 'primary':
        list.push(styles.textPrimary);
        break;
      case 'secondary':
        list.push(styles.textSecondary);
        break;
      case 'outline':
        list.push(styles.textOutline);
        break;
      case 'ghost':
        list.push(styles.textGhost);
        break;
      case 'whatsapp':
        list.push(styles.textWhatsapp);
        break;
      case 'danger':
        list.push(styles.textDanger);
        break;
    }

    if (textStyle) {
      list.push(textStyle);
    }

    return list;
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'whatsapp':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
      case 'outline':
      case 'ghost':
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
              color={getIconColor()}
              style={styles.leftIcon}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
              color={getIconColor()}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
  },
  lg: {
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.xxl,
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  whatsapp: {
    backgroundColor: colors.whatsapp,
  },
  danger: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_sm: {
    fontSize: typography.fontSize.sm,
  },
  text_md: {
    fontSize: typography.fontSize.base,
  },
  text_lg: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: colors.primary,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textWhatsapp: {
    color: '#FFFFFF',
  },
  textDanger: {
    color: '#FFFFFF',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});

