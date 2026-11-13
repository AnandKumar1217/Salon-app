import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type Props = any;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, deleteAccount } = useAuth();

  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Glamora?', [
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your booking history and saved preferences will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            navigation.replace('RoleSelection');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Glamora Guest'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+91 98450 12345'}</Text>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Section 1: Salons & Preferences */}
        <Text style={styles.sectionHeader}>Saved & Preferences</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SavedSalons')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={styles.menuLabel}>Saved Salons</Text>
            </View>
            <View style={styles.menuRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{user?.savedSalonIds?.length || 0}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
              <Text style={styles.menuLabel}>WhatsApp Reminders & Updates</Text>
            </View>
            <Switch
              value={whatsappReminders}
              onValueChange={setWhatsappReminders}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={styles.menuLabel}>App Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 2: Support & Legal */}
        <Text style={styles.sectionHeader}>Support & About</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.menuLabel}>Help & Customer Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('TermsPrivacy')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={styles.menuLabel}>Terms of Service & Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Section 3: Account Actions */}
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuLabel}>Sign Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.menuLabel, { color: colors.error }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionLabel}>Glamora v1.0.0 • Production Build</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: spacing.huge,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userPhone: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
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
    gap: spacing.md,
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  versionLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
