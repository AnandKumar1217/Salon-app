import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { setPreferredNavigationRole, user, switchMode } = useAuth();

  const handleSelectCustomer = async () => {
    await setPreferredNavigationRole('customer');
    if (user && user.roles.includes('customer')) {
      await switchMode('CUSTOMER');
      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } else {
      navigation.navigate('Login', { rolePreference: 'customer' });
    }
  };

  const handleSelectOwner = async () => {
    await setPreferredNavigationRole('salon_owner');
    if (user && user.roles.includes('salon_owner')) {
      if (user.applicationStatus === 'APPROVED') {
        await switchMode('OWNER');
        navigation.replace('OwnerTabs', { screen: 'DashboardTab' });
      } else if (user.applicationStatus === 'PENDING_APPROVAL') {
        navigation.replace('PendingApproval');
      } else if (user.applicationStatus === 'REJECTED') {
        navigation.replace('RejectedApplication', { reason: user.rejectionReason });
      } else if (user.applicationStatus === 'SUSPENDED') {
        navigation.replace('SuspendedAccount', { reason: user.rejectionReason });
      } else {
        navigation.navigate('OwnerRegistrationWizard');
      }
    } else {
      navigation.navigate('Login', { rolePreference: 'salon_owner' });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Decorative Luxury Ambient Glow Orbs */}
      <View style={styles.glowOrbTopRight} pointerEvents="none" />
      <View style={styles.glowOrbBottomLeft} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Regal Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.emblemOuterRing}>
            <LinearGradient
              colors={['#4A1E36', '#6C264D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emblemBadge}
            >
              <Text style={styles.brandLetter}>G</Text>
              <View style={styles.sparkleDot}>
                <Ionicons name="sparkles" size={10} color="#D4AF37" />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.brandName}>GLAMORA</Text>

          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>HAUTE BEAUTÉ & WELLNESS</Text>
          </View>
        </View>

        {/* 2. Elevated Welcome Section */}
        <View style={styles.headingSection}>
          <Text style={styles.welcomeLabel}>Welcome to</Text>
          <Text style={styles.mainHeading}>Pure Elegance ✨</Text>
          <Text style={styles.subheading}>
            Step into bespoke salon care with master stylists, organic therapies, and guaranteed zero waiting time.
          </Text>
        </View>

        {/* 3. Luxury Interactive Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Customer (Showstopper VIP Experience) */}
          <TouchableOpacity
            onPress={handleSelectCustomer}
            activeOpacity={0.92}
            style={styles.cardTouchWrapper}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FFF9FB', '#FFF5F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.luxuryCard, styles.customerCardBorder]}
            >
              {/* Top Accent Ribbon */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.clientTag}>
                  <Ionicons name="sparkles" size={11} color="#A65D71" style={{ marginRight: 4 }} />
                  <Text style={styles.clientTagText}>CLIENT EXPERIENCE • INSTANT ACCESS</Text>
                </View>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>MOST POPULAR</Text>
                </View>
              </View>

              {/* Main Card Body */}
              <View style={styles.cardBodyRow}>
                <View style={styles.iconContainerOuter}>
                  <LinearGradient
                    colors={['#4A1E36', '#7A2C58']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradientCircle}
                  >
                    <Ionicons name="sparkles-sharp" size={24} color="#FAF7F2" />
                  </LinearGradient>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={styles.cardMainTitle}>I'm a Customer</Text>
                  <Text style={styles.cardTagline}>Discover, pamper & book appointments</Text>
                  <Text style={styles.cardDetailText}>
                    Explore handpicked salons, view transparent menus, and reserve your stylist with real-time slot lock.
                  </Text>
                </View>

                <LinearGradient
                  colors={['#4A1E36', '#652D4C']}
                  style={styles.arrowButton}
                >
                  <Ionicons name="arrow-forward" size={18} color="#FAF7F2" />
                </LinearGradient>
              </View>

              {/* Feature Chips */}
              <View style={styles.featurePillRow}>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillIcon}>💎</Text>
                  <Text style={styles.featurePillLabel}>Top-Tier Salons</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillIcon}>⚡</Text>
                  <Text style={styles.featurePillLabel}>Instant Confirmation</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillIcon}>✨</Text>
                  <Text style={styles.featurePillLabel}>Zero Waiting</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Card 2: Salon Owner (Prestige Partner Suite) */}
          <TouchableOpacity
            onPress={handleSelectOwner}
            activeOpacity={0.92}
            style={styles.cardTouchWrapper}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FDF8F5', '#FBF4EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.luxuryCard, styles.ownerCardBorder]}
            >
              {/* Top Accent Ribbon */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.ownerTag}>
                  <Ionicons name="business" size={11} color="#8A4A5D" style={{ marginRight: 4 }} />
                  <Text style={styles.ownerTagText}>SALON PARTNER • PRO PLATFORM</Text>
                </View>
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>BUSINESS SUITE</Text>
                </View>
              </View>

              {/* Main Card Body */}
              <View style={styles.cardBodyRow}>
                <View style={styles.iconContainerOuter}>
                  <LinearGradient
                    colors={['#8A4A5D', '#B5657A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradientCircle}
                  >
                    <Ionicons name="storefront-outline" size={24} color="#FAF7F2" />
                  </LinearGradient>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={styles.cardMainTitle}>I'm a Salon Owner</Text>
                  <Text style={styles.cardTagline}>Manage schedules, staff & revenue</Text>
                  <Text style={styles.cardDetailText}>
                    Streamline walk-in queues, sync online bookings, assign specialists, and oversee live salon performance.
                  </Text>
                </View>

                <LinearGradient
                  colors={['#8A4A5D', '#B5657A']}
                  style={styles.arrowButton}
                >
                  <Ionicons name="arrow-forward" size={18} color="#FAF7F2" />
                </LinearGradient>
              </View>

              {/* Feature Chips */}
              <View style={styles.featurePillRow}>
                <View style={styles.featurePillOwner}>
                  <Text style={styles.featurePillIcon}>📅</Text>
                  <Text style={styles.featurePillLabelOwner}>Live Calendar</Text>
                </View>
                <View style={styles.featurePillOwner}>
                  <Text style={styles.featurePillIcon}>👥</Text>
                  <Text style={styles.featurePillLabelOwner}>Staff Roster</Text>
                </View>
                <View style={styles.featurePillOwner}>
                  <Text style={styles.featurePillIcon}>📊</Text>
                  <Text style={styles.featurePillLabelOwner}>Daily Insights</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 4. Luxury Trust & Navigation Footer */}
        <View style={styles.footer}>
          {/* Trust Banner */}
          <View style={styles.trustBanner}>
            <View style={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name="star" size={13} color="#D4AF37" style={{ marginHorizontal: 1 }} />
              ))}
            </View>
            <Text style={styles.trustText}>Rated 4.9/5 by 50,000+ Beauty & Grooming Clients</Text>
          </View>

          {/* Elegant Sign-in Pill */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login', { rolePreference: 'customer' })}
            style={styles.loginPillButton}
            activeOpacity={0.8}
          >
            <Text style={styles.loginHint}>Already have an account?</Text>
            <Text style={styles.loginLink}>Sign In</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.primary} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          {/* Terms & Privacy */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TermsPrivacy')}
            style={styles.legalBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.legalText}>Terms of Service & Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  glowOrbTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(232, 196, 206, 0.45)',
  },
  glowOrbBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 224, 202, 0.40)',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: spacing.xxl,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  emblemOuterRing: {
    padding: 3,
    borderRadius: 36,
    backgroundColor: 'rgba(200, 130, 148, 0.25)',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.xs + 2,
  },
  emblemBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brandLetter: {
    color: '#FAF7F2',
    fontWeight: '900',
    fontSize: 32,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  sparkleDot: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
    color: colors.primary,
    marginTop: 4,
  },
  brandPill: {
    backgroundColor: 'rgba(74, 30, 54, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(74, 30, 54, 0.12)',
    marginTop: 6,
  },
  brandPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primary,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  welcomeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8A5D6B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#28111F',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13.5,
    color: '#5C5450',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 340,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: spacing.lg,
  },
  cardTouchWrapper: {
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  luxuryCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
  },
  customerCardBorder: {
    borderColor: 'rgba(200, 130, 148, 0.35)',
  },
  ownerCardBorder: {
    borderColor: 'rgba(212, 175, 155, 0.40)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 130, 148, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  clientTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A3B52',
    letterSpacing: 0.5,
  },
  recommendedBadge: {
    backgroundColor: '#FAF0E6',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#996515',
    letterSpacing: 0.5,
  },
  ownerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 74, 93, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  ownerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A3548',
    letterSpacing: 0.5,
  },
  ownerBadge: {
    backgroundColor: 'rgba(138, 74, 93, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(138, 74, 93, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A3548',
    letterSpacing: 0.5,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainerOuter: {
    marginRight: 14,
  },
  iconGradientCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTextContent: {
    flex: 1,
    marginRight: 10,
  },
  cardMainTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E1218',
    letterSpacing: -0.3,
  },
  cardTagline: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A65D71',
    marginTop: 1,
    marginBottom: 4,
  },
  cardDetailText: {
    fontSize: 11.5,
    color: '#6E6662',
    lineHeight: 16,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 5,
    elevation: 2,
  },
  featurePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 224, 213, 0.60)',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(200, 130, 148, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  featurePillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  featurePillLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4A1E36',
  },
  featurePillOwner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 155, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  featurePillLabelOwner: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#652D4C',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trustBanner: {
    alignItems: 'center',
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trustText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#736B66',
  },
  loginPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(74, 30, 54, 0.15)',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  loginHint: {
    fontSize: 13,
    color: '#615B57',
    marginRight: 5,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  legalBtn: {
    marginTop: 12,
    paddingVertical: 4,
  },
  legalText: {
    fontSize: 11,
    color: '#A09892',
    textDecorationLine: 'underline',
  },
});
