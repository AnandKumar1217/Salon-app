import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { useAuth } from '../../../context/AuthContext';
import { ServiceEditModal } from '../../../components/modals/ServiceEditModal';

export const OwnerMoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { salon } = useOwnerSalon();
  const { logout } = useAuth();
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of your salon management account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('RoleSelection');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Salon Settings & More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Salon Info Card */}
        <View style={styles.salonInfoCard}>
          <Image
            source={{
              uri:
                salon?.coverImage ||
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.salonCover}
          />
          <View style={styles.salonDetails}>
            <Text style={styles.salonName}>{salon?.name || 'Maison De Belle'}</Text>
            <Text style={styles.salonTagline}>{salon?.tagline}</Text>
            <Text style={styles.salonAddress} numberOfLines={1}>
              📍 {salon?.address}
            </Text>
          </View>
        </View>

        {/* Section 1: Business Operations */}
        <Text style={styles.sectionHeader}>Business & Growth</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SalonQrCode')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FAF0F3' }]}>
                <Ionicons name="qr-code" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.menuLabel}>Public Booking Link & QR Code</Text>
                <Text style={styles.menuSub}>Share on Instagram Bio, WhatsApp, or Google</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OwnerReports')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="stats-chart" size={18} color={colors.success} />
              </View>
              <View>
                <Text style={styles.menuLabel}>Collections & Financial Reports</Text>
                <Text style={styles.menuSub}>Daily revenue, cash vs online, settlement</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => setServiceModalVisible(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="cut" size={18} color={colors.info} />
              </View>
              <View>
                <Text style={styles.menuLabel}>Add / Edit Treatments & Pricing</Text>
                <Text style={styles.menuSub}>Manage salon menu, duration, buffers</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Salon Policies & Settings */}
        <Text style={styles.sectionHeader}>Salon Configuration</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('SalonProfileEdit')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceWarm }]}>
                <Ionicons name="business" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.menuLabel}>Salon Profile & Buffer Policies</Text>
                <Text style={styles.menuSub}>Address, hours, WhatsApp contact, buffers</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Section 3: Account Actions */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.error }]}>Sign Out of Salon</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionLabel}>Glamora Salon Suite v1.0.0 • Partner Build</Text>
      </ScrollView>

      {/* Add / Edit Service Modal */}
      <ServiceEditModal
        visible={serviceModalVisible}
        onClose={() => setServiceModalVisible(false)}
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
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.subtle,
  },
  topBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  salonInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  salonCover: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surfaceWarm,
  },
  salonDetails: {
    padding: spacing.md,
  },
  salonName: {
    fontSize: typography.fontSize.base + 1,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  salonTagline: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  salonAddress: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textTertiary,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  versionLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});

