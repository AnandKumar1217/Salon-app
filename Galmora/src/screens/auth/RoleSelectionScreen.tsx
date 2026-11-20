import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand & Welcome Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>G</Text>
          </View>
          <Text style={styles.brandTitle}>GLAMORA</Text>
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.subheading}>
            Select how you'd like to get started
          </Text>
        </View>

        {/* Clean, Pretty Role Selection Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Customer */}
          <TouchableOpacity
            style={styles.card}
            onPress={handleSelectCustomer}
            activeOpacity={0.85}
          >
            <View style={[styles.iconContainer, styles.customerIconBg]}>
              <Ionicons name="sparkles" size={22} color="#8A3B52" />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardDesc}>
                Discover top salons & book appointments
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={18} color="#8A3B52" />
            </View>
          </TouchableOpacity>

          {/* Card 2: Salon Owner */}
          <TouchableOpacity
            style={styles.card}
            onPress={handleSelectOwner}
            activeOpacity={0.85}
          >
            <View style={[styles.iconContainer, styles.ownerIconBg]}>
              <Ionicons name="storefront-outline" size={22} color="#5C3345" />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>I'm a Salon Owner</Text>
              <Text style={styles.cardDesc}>
                Manage appointments, staff & services
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={18} color="#5C3345" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Clean & Elegant Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login', { rolePreference: 'customer' })}
            style={styles.signInButton}
            activeOpacity={0.7}
          >
            <Text style={styles.signInHint}>Already have an account? </Text>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TermsPrivacy')}
            style={styles.termsButton}
            activeOpacity={0.7}
          >
            <Text style={styles.termsText}>Terms of Service & Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 6,
    paddingBottom: 36,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  logoLetter: {
    color: '#FAF8F5',
    fontSize: 30,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.primary,
    marginBottom: 16,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F1E1E',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: '#736B66',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE9E3',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerIconBg: {
    backgroundColor: '#F8EFF2',
  },
  ownerIconBg: {
    backgroundColor: '#F5ECE7',
  },
  cardText: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F1E1E',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#736B66',
    lineHeight: 18,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signInHint: {
    fontSize: 14,
    color: '#736B66',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  termsButton: {
    marginTop: 10,
    paddingVertical: 6,
  },
  termsText: {
    fontSize: 12,
    color: '#9E9690',
  },
});
