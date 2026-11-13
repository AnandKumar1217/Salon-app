import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { CATEGORIES } from '../../constants/mockData';
import { SalonCard } from '../../components/cards/SalonCard';
import { LocationPickerModal } from '../../components/common/LocationPickerModal';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useBookings } from '../../context/BookingsContext';
import { fetchSalons } from '../../api/salonsApi';
import { Salon } from '../../types';

type Props = any;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { currentArea, currentCity } = useLocation();
  const { activeUpcomingBooking } = useBookings();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchSalons();
      setSalons(data);
    } catch (e) {
      console.warn('Error loading salons on home:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const featuredSalons = salons.filter((s) => s.isFeatured);
  const popularServices = salons.flatMap((s) =>
    (s.services || []).filter((srv) => srv.popular).map((srv) => ({
      id: srv.id,
      salonId: s.id,
      name: srv.name,
      price: srv.price,
      salonName: s.name,
      time: `${srv.durationMinutes} mins`,
      image: srv.imageUrl || s.coverImage,
    }))
  ).slice(0, 6);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.greetingText}>
            Good day, {user?.name ? user.name.split(' ')[0] : 'Guest'} ✨
          </Text>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {currentArea}, {currentCity}
            </Text>
            <Ionicons name="chevron-down" size={13} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person-circle" size={38} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar Action Button */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('ExploreTab')}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <Text style={styles.searchPlaceholder}>Search salons, hair stylists, facials...</Text>
          <View style={styles.filterIconBadge}>
            <Ionicons name="options-outline" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Dynamic Upcoming Appointment Alert */}
        {activeUpcomingBooking && (
          <TouchableOpacity
            style={styles.upcomingBanner}
            onPress={() =>
              navigation.navigate('AppointmentDetail', { bookingId: activeUpcomingBooking.id })
            }
            activeOpacity={0.88}
          >
            <View style={styles.upcomingIconCircle}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <View style={styles.upcomingInfo}>
              <View style={styles.upcomingTagRow}>
                <Text style={styles.upcomingTag}>UPCOMING APPOINTMENT</Text>
                <Text style={styles.upcomingTime}>
                  {activeUpcomingBooking.date} • {activeUpcomingBooking.startTime}
                </Text>
              </View>
              <Text style={styles.upcomingSalonName} numberOfLines={1}>
                {activeUpcomingBooking.salonName}
              </Text>
              <Text style={styles.upcomingStylist} numberOfLines={1}>
                Stylist: {activeUpcomingBooking.staffName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Promo / Salon Experience Banner */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Text style={styles.promoBadge}>MEMBERS PRIVILEGE</Text>
            <Text style={styles.promoTitle}>Zero Waiting Guaranteed</Text>
            <Text style={styles.promoSubtitle}>
              Direct sync with salon schedules. Your booked chair is ready when you arrive.
            </Text>
            <TouchableOpacity
              style={styles.promoCta}
              onPress={() => navigation.navigate('ExploreTab')}
            >
              <Text style={styles.promoCtaText}>Book a Salon</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore by Service</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScrollWrapper}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('ExploreTab', { category: cat.name })}
              activeOpacity={0.8}
            >
              <Image source={{ uri: cat.image }} style={styles.categoryImage} />
              <View style={styles.categoryOverlay} />
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Nearby Salons */}
        {featuredSalons.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Nearby Salons</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScrollWrapper}
              contentContainerStyle={styles.horizontalSalons}
            >
              {featuredSalons.map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  compact
                  onPress={() => navigation.navigate('SalonDetail', { salonId: salon.id })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Popular Services Quick Booking */}
        {popularServices.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Services</Text>
            </View>
            <View style={styles.popularList}>
              {popularServices.map((srv) => (
                <TouchableOpacity
                  key={srv.id}
                  style={styles.popularCard}
                  onPress={() =>
                    navigation.navigate('BookingFlow', {
                      salonId: srv.salonId,
                      preselectedServiceId: srv.id,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: srv.image }} style={styles.popularImg} />
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularName}>{srv.name}</Text>
                    <Text style={styles.popularSalon}>{srv.salonName}</Text>
                    <View style={styles.popularMeta}>
                      <Text style={styles.popularDuration}>{srv.time}</Text>
                      <Text style={styles.popularDot}>•</Text>
                      <Text style={styles.popularPrice}>₹{srv.price}</Text>
                    </View>
                  </View>
                  <View style={styles.bookIconPill}>
                    <Text style={styles.bookPillText}>Book</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* All Curated Salons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Recommended Salons</Text>
        </View>
        {salons.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Ionicons name="sparkles-outline" size={36} color={colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No salons available yet</Text>
            <Text style={styles.emptyStateSub}>
              We are onboarding luxury salons in your area. Check back soon!
            </Text>
          </View>
        ) : (
          salons.map((salon) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              onPress={() => navigation.navigate('SalonDetail', { salonId: salon.id })}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 8,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  topLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 220,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.subtle,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  filterIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF0F3',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.roseLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  upcomingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  upcomingTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.primary,
  },
  upcomingTime: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  upcomingSalonName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  upcomingStylist: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  promoCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  promoContent: {
    position: 'relative',
  },
  promoBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.rose,
    marginBottom: 6,
  },
  promoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#FAF7F2',
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: typography.fontSize.xs,
    color: '#D4C8CF',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  promoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.roseDark,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  promoCtaText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  horizontalScrollWrapper: {
    marginHorizontal: -spacing.lg,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  categoryCard: {
    width: 100,
    height: 120,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  categoryImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31, 30, 30, 0.4)',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  horizontalSalons: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  popularList: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  popularImg: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  popularInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  popularName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  popularSalon: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  popularMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularDuration: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  popularDot: {
    marginHorizontal: 4,
    color: colors.borderDark,
  },
  popularPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  bookIconPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  bookPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyStateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyStateSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
});
