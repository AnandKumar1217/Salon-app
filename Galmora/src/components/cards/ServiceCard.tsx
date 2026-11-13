import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { ServiceItem } from '../../types';

interface ServiceCardProps {
  service: ServiceItem;
  isSelected: boolean;
  onToggle: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onToggle }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{service.name}</Text>
          {service.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {service.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{service.durationMinutes} mins</Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.price}>₹{service.price}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, isSelected && styles.selectedAddButton]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isSelected ? 'checkmark' : 'add'}
          size={20}
          color={isSelected ? '#FFFFFF' : colors.primary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm + 2,
  },
  selectedContainer: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5F7',
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  popularBadge: {
    backgroundColor: colors.roseLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.roseDark,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: spacing.sm,
    color: colors.borderDark,
  },
  price: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectedAddButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

