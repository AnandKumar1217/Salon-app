import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

export const SkeletonBox: React.FC<{
  width: number | string;
  height: number;
  radius?: number;
  style?: ViewStyle;
}> = ({ width, height, radius = borderRadius.md, style }) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.borderLight,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const SalonCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <SkeletonBox width="100%" height={160} radius={borderRadius.lg} />
      <View style={{ marginTop: spacing.md }}>
        <SkeletonBox width="60%" height={20} radius={borderRadius.sm} />
        <SkeletonBox width="85%" height={14} radius={borderRadius.sm} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <SkeletonBox width="35%" height={16} radius={borderRadius.sm} />
          <SkeletonBox width="25%" height={16} radius={borderRadius.sm} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});

