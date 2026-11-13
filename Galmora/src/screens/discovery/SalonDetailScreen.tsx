import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { ServiceCard } from '../../components/cards/ServiceCard';
import { StylistCard } from '../../components/cards/StylistCard';
import { Button } from '../../components/common/Button';
import { RatingStars } from '../../components/common/RatingStars';
import { Badge } from '../../components/common/Badge';
import { fetchSalonById } from '../../api/salonsApi';
import { useAuth } from '../../context/AuthContext';
import { Salon, ServiceItem } from '../../types';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SalonDetail'>;

export const SalonDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { salonId } = route.params;
  const { user, toggleSaveSalon } = useAuth();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'stylists' | 'about'>('services');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadSalon();
  }, [salonId]);

  const loadSalon = async () => {
    const data = await fetchSalonById(salonId);
    if (data) {
      setSalon(data);
      // Preselect first popular service for instant convenience
      if (data.services && data.services.length > 0) {
        setSelectedServices([data.services[0]]);
      }
    }
  };

  if (!salon) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Salon Details...</Text>
      </View>
    );
  }

  const isSaved = user?.savedSalonIds?.includes(salon.id) || false;

  const toggleService = (service: ServiceItem) => {
    const exists = selectedServices.some((s) => s.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

  const handleShare = async () => {
    try {
      await Share.share({
        title: salon.name,
        message: `Book appointments with zero waiting at ${salon.name} on Glamora: https://glamora.app/salon/${salon.id}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${salon.phone.replace(/\s+/g, '')}`);
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${salon.name}, ${salon.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleWhatsAppBooking = () => {
    const serviceNames =
      selectedServices.length > 0
        ? selectedServices.map((s) => s.name).join(', ')
        : 'Salon Services';
    const message = encodeURIComponent(
      `Hello ${salon.name}! 👋 I would like to book an appointment through Glamora.\n\n*Customer:* ${user?.name || 'Customer'}\n*Services:* ${serviceNames}\n*Preferred Date/Time:* Earliest available\n\nPlease let me know available slots.`
    );
    const cleanNumber = (salon.whatsappNumber || salon.phone).replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}&text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNumber}?text=${message}`);
    });
  };

  const handleBookNow = () => {
    if (selectedServices.length === 0) return;
    navigation.navigate('BookingFlow', {
      salonId: salon.id,
      preselectedServiceId: selectedServices[0].id,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Gallery Slider */}
        <View style={styles.galleryWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(idx);
            }}
          >
            {(salon.images || [salon.coverImage]).map((imgUri, i) => (
              <Image key={i} source={{ uri: imgUri }} style={styles.heroImage} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Top Floating Actions */}
          <View style={styles.floatingNav}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.navRight}>
              <TouchableOpacity
                style={styles.navCircleBtn}
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navCircleBtn}
                onPress={() => toggleSaveSalon(salon.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isSaved ? colors.error : colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dots Indicator */}
          <View style={styles.galleryDots}>
            {(salon.images || [salon.coverImage]).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeImageIndex === i ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Salon Summary Header */}
        <View style={styles.salonInfoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.salonName}>{salon.name}</Text>
            <Badge label="Open Now" variant="success" size="sm" />
          </View>

          <Text style={styles.tagline}>{salon.tagline}</Text>

          <View style={styles.ratingAndDistRow}>
            <RatingStars rating={salon.rating} reviewCount={salon.reviewCount} size={15} />
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.distanceText}>{salon.distanceKm || 1.2} km away</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.priceLevel}>{salon.priceLevel} Luxury</Text>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.addressText} numberOfLines={2}>
              {salon.address}
            </Text>
          </View>

          {/* Quick Contact & WhatsApp Actions */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleDirections} activeOpacity={0.8}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={styles.quickActionLabel}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.quickActionLabel}>Call Salon</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.whatsappQuickBtn]}
              onPress={handleWhatsAppBooking}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappQuickLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabsHeader}>
          {(['services', 'stylists', 'about'] as const).map((tab) => {
            const isTabActive = activeTab === tab;
            const labels = {
              services: `Services (${salon.services?.length || 0})`,
              stylists: `Stylists (${salon.staff?.length || 0})`,
              about: 'About & Reviews',
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isTabActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabLabel, isTabActive && styles.tabLabelActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Services List */}
        {activeTab === 'services' && (
          <View style={styles.tabContent}>
            <View style={styles.servicesHeaderNote}>
              <Text style={styles.noteTitle}>Select one or more services to book:</Text>
              <Text style={styles.noteSub}>Total time and pricing updates automatically</Text>
            </View>

            {salon.services?.map((srv) => (
              <ServiceCard
                key={srv.id}
                service={srv}
                isSelected={selectedServices.some((s) => s.id === srv.id)}
                onToggle={() => toggleService(srv)}
              />
            ))}
          </View>
        )}

        {/* Tab 2: Stylists & Staff */}
        {activeTab === 'stylists' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabSubheader}>
              Experienced resident masters with individual appointment schedules.
            </Text>
            {salon.staff?.map((staffMember) => (
              <StylistCard
                key={staffMember.id}
                staff={staffMember}
                isSelected={false}
                onSelect={() => {
                  setActiveTab('services');
                }}
              />
            ))}
          </View>
        )}

        {/* Tab 3: About & Reviews */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <Text style={styles.aboutDesc}>{salon.description}</Text>

            <Text style={styles.aboutSectionTitle}>Amenities & Features</Text>
            <View style={styles.amenitiesWrap}>
              {salon.amenities?.map((am, i) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={styles.amenityText}>{am}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.aboutSectionTitle}>Operating Hours</Text>
            <View style={styles.hoursBox}>
              <Text style={styles.hoursRow}>Monday – Friday: 09:00 AM – 09:00 PM</Text>
              <Text style={styles.hoursRow}>Saturday – Sunday: 08:30 AM – 09:30 PM</Text>
            </View>

            <Text style={styles.aboutSectionTitle}>Client Reviews ({salon.reviewCount})</Text>
            {salon.reviews?.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewerName}>{rev.userName}</Text>
                  <RatingStars rating={rev.rating} size={12} />
                </View>
                {rev.serviceName && <Text style={styles.reviewService}>{rev.serviceName}</Text>}
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom padding for floating tray */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Bottom Booking Tray */}
      {selectedServices.length > 0 && (
        <View style={styles.floatingTray}>
          <View style={styles.trayInfo}>
            <Text style={styles.trayCount}>
              {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected
            </Text>
            <View style={styles.trayMeta}>
              <Text style={styles.trayPrice}>₹{totalPrice}</Text>
              <Text style={styles.trayDuration}>• {totalDuration} mins</Text>
            </View>
          </View>

          <Button
            title="Select Time & Stylist"
            onPress={handleBookNow}
            size="md"
            rightIcon="arrow-forward"
            style={styles.trayBookBtn}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  galleryWrapper: {
    width,
    height: 280,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  heroImage: {
    width,
    height: 280,
  },
  floatingNav: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 8,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  navRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  galleryDots: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  salonInfoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    ...shadows.subtle,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  salonName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  ratingAndDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dotSeparator: {
    marginHorizontal: spacing.sm,
    color: colors.borderDark,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  priceLevel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  whatsappQuickBtn: {
    backgroundColor: colors.whatsapp,
  },
  whatsappQuickLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginTop: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    padding: spacing.lg,
  },
  servicesHeaderNote: {
    marginBottom: spacing.md,
  },
  noteTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noteSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabSubheader: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  aboutDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  aboutSectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  hoursBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hoursRow: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewService: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  floatingTray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.md + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.floating,
  },
  trayInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  trayCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trayMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  trayPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  trayDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  trayBookBtn: {
    paddingHorizontal: spacing.lg,
  },
});
