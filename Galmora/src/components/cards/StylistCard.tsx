import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Staff } from '../../types';

interface StylistCardProps {
  staff?: Staff;
  isAnyAvailable?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export const StylistCard: React.FC<StylistCardProps> = ({
  staff,
  isAnyAvailable = false,
  isSelected,
  onSelect,
}) => {
  if (isAnyAvailable) {
    return (
      <TouchableOpacity
        style={[styles.container, isSelected && styles.selectedContainer]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <View style={styles.anyAvatar}>
          <Ionicons name="sparkles" size={24} color={isSelected ? '#FFF' : colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isSelected && styles.selectedText]}>Any Available Stylist</Text>
          <Text style={styles.role}>Fastest booking • Assigns top rated staff</Text>
        </View>
        <View style={[styles.radio, isSelected && styles.selectedRadio]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  }

  if (!staff) return null;

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <Image source={{ uri: staff.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isSelected && styles.selectedText]}>{staff.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#D48B38" />
            <Text style={styles.ratingText}>{staff.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.role}>{staff.role}</Text>
        <Text style={styles.experience}>{staff.experienceYears} yrs experience</Text>
      </View>
      <View style={[styles.radio, isSelected && styles.selectedRadio]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
  },
  anyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.primary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  role: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  experience: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

