import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../constants/theme';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 14,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="star" size={size} color="#D48B38" />
      <Text style={[styles.rating, { fontSize: size + 1 }]}>
        {rating.toFixed(1)}
      </Text>
      {reviewCount !== undefined && (
        <Text style={[styles.reviews, { fontSize: size }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 3,
  },
  reviews: {
    color: colors.textSecondary,
    marginLeft: 3,
  },
});

