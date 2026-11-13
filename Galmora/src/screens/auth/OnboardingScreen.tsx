import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

interface Slide {
  id: string;
  title: string;
  description: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Curated Salons in Your Neighborhood',
    description:
      'Handpicked luxury salons, master stylists, and organic spas with authentic reviews and transparent pricing.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    title: 'Zero Waiting Time Guaranteed',
    description:
      'Live synchronized staff calendars protect your start window. Walk-ins and app bookings never overlap.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    title: 'Book via App or WhatsApp',
    description:
      'Seamlessly reserve your preferred stylist online, or chat directly via verified WhatsApp with instant server confirmation.',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await completeOnboarding();
      navigation.replace('RoleSelection');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.replace('RoleSelection');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>GLAMORA</Text>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.imageCard}>
              <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          size="lg"
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUS_BAR_HEIGHT + 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primary,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  imageCard: {
    width: width - spacing.lg * 2,
    height: height * 0.44,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    marginTop: spacing.md,
    backgroundColor: colors.surfaceWarm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.xl,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.base,
  },
  bottomControls: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: colors.borderDark,
  },
  actionBtn: {
    width: '100%',
  },
});
