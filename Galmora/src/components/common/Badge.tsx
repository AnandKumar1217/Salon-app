import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { BookingStatus } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'rose' | 'whatsapp';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  style,
}) => {
  return (
    <View style={[styles.container, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles], styles[`text_${size}` as keyof typeof styles]]}>
        {label}
      </Text>
    </View>
  );
};

export const BookingStatusBadge: React.FC<{
  status: BookingStatus;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}> = ({ status, size = 'sm', style }) => {
  switch (status) {
    case 'CONFIRMED':
      return <Badge label="Confirmed" variant="success" size={size} style={style} />;
    case 'IN_PROGRESS':
      return <Badge label="In Progress" variant="primary" size={size} style={style} />;
    case 'COMPLETED':
      return <Badge label="Completed" variant="neutral" size={size} style={style} />;
    case 'CANCELLED':
      return <Badge label="Cancelled" variant="danger" size={size} style={style} />;
    case 'NO_SHOW':
      return <Badge label="No Show" variant="warning" size={size} style={style} />;
    default:
      return <Badge label={status} variant="neutral" size={size} style={style} />;
  }
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: 2,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.primaryMuted,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  danger: {
    backgroundColor: colors.errorLight,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
  },
  rose: {
    backgroundColor: colors.roseLight,
  },
  whatsapp: {
    backgroundColor: colors.whatsappLight,
  },
  text: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: typography.fontSize.xs,
  },
  text_md: {
    fontSize: typography.fontSize.sm,
  },
  text_primary: {
    color: colors.primary,
  },
  text_success: {
    color: colors.success,
  },
  text_warning: {
    color: colors.warning,
  },
  text_danger: {
    color: colors.error,
  },
  text_neutral: {
    color: colors.textSecondary,
  },
  text_rose: {
    color: colors.roseDark,
  },
  text_whatsapp: {
    color: colors.whatsappDark,
  },
});
