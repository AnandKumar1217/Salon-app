import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Salon } from '../../types';
import { RatingStars } from '../common/RatingStars';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface SalonCardProps {
  salon: Salon;
  onPress: () => void;
  compact?: boolean;
}

export const SalonCard: React.FC<SalonCardProps> = ({ salon, onPress, compact = false }) => {
  const { user, toggleSaveSalon } = useAuth();
  const isSaved = user?.savedSalonIds?.includes(salon.id) || false;

  const handleHeartPress = (e: any) => {
    e.stopPropagation();
    toggleSaveSalon(salon.id);
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: salon.coverImage }}
          style={compact ? styles.compactImage : styles.image}
          resizeMode="cover"
        />

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleHeartPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={18}
            color={isSaved ? colors.error : colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Featured Tag */}
        {salon.isFeatured && (
          <View style={styles.featuredBadge}>
            <Badge label="Featured" variant="rose" size="sm" />
          </View>
        )}

        {/* Distance Pill */}
        {salon.distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location-sharp" size={12} color={colors.textPrimary} />
            <Text style={styles.distanceText}>{salon.distanceKm} km</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {salon.name}
          </Text>
          <RatingStars rating={salon.rating} reviewCount={salon.reviewCount} />
        </View>

        <Text style={styles.area} numberOfLines={1}>
          {salon.area}, {salon.city}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>
            From <Text style={styles.priceValue}>₹{salon.startingPrice}</Text>
          </Text>

          <View style={styles.instantPill}>
            <Ionicons name="flash" size={12} color={colors.primary} />
            <Text style={styles.instantText}>Instant Book</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  compactContainer: {
    width: 260,
    marginRight: spacing.md,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: 180,
  },
  compactImage: {
    width: '100%',
    height: 140,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  area: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  price: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  instantText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
});

