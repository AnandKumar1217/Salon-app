import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OwnerRegistrationWizard'>;
};

const SALON_CATEGORIES = [
  'Hair & Styling Lounge',
  'Color & Aesthetic Bar',
  'Gentlemen Barber & Grooming',
  'Holistic Spa & Skin Clinic',
  'Nail Couture & Lash Studio',
  'Unisex Premium Salon',
];

export const OwnerRegistrationWizard: React.FC<Props> = ({ navigation }) => {
  const { submitOwnerApplication } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Step 2: Salon Location & Contact
  const [salonName, setSalonName] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('');
  const [salonContact, setSalonContact] = useState('');

  // Step 3: Business Information & Category
  const [salonCategory, setSalonCategory] = useState(SALON_CATEGORIES[0]);
  const [businessDescription, setBusinessDescription] = useState('');
  const [taxOrRegNumber, setTaxOrRegNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!ownerName.trim()) errs.ownerName = 'Owner full name is required.';
    if (!ownerPhone.trim() || ownerPhone.replace(/\D/g, '').length < 10) {
      errs.ownerPhone = 'Valid 10-digit mobile number is required.';
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      errs.ownerEmail = 'Valid business email is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!salonName.trim()) errs.salonName = 'Salon name is required.';
    if (!salonAddress.trim()) errs.salonAddress = 'Full physical street address is required.';
    if (!city.trim()) errs.city = 'City is required.';
    if (!postalCode.trim() || postalCode.length < 5) {
      errs.postalCode = 'Valid postal / ZIP code is required.';
    }
    if (!salonContact.trim()) errs.salonContact = 'Salon reception contact number is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!businessDescription.trim() || businessDescription.length < 20) {
      errs.businessDescription = 'Please provide a brief description (min 20 characters).';
    }
    if (!agreedToTerms) {
      errs.terms = 'You must agree to Glamora Partner Terms and Salon Policies.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    try {
      setIsSubmitting(true);
      await submitOwnerApplication({
        ownerName,
        ownerPhone,
        ownerEmail,
        salonName,
        salonAddress,
        city,
        postalCode,
        salonContact,
        salonCategory,
        businessDescription,
        taxOrRegNumber,
      });

      // Navigate to pending approval status screen
      navigation.replace('PendingApproval');
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Failed to submit application. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Register Your Salon</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentStep} of 3</Text>
        </View>
      </View>

      {/* Progress Line */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: currentStep === 1 ? '33.3%' : currentStep === 2 ? '66.6%' : '100%' },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            {currentStep === 1 && '1. Owner Information'}
            {currentStep === 2 && '2. Salon Address & Contact'}
            {currentStep === 3 && '3. Category & Business Verification'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {currentStep === 1 && 'Tell us who will be managing this salon account on Glamora.'}
            {currentStep === 2 && 'Enter the physical location your clients will visit.'}
            {currentStep === 3 && 'Provide your salon specialty and business verification details.'}
          </Text>
        </View>

        {/* STEP 1: Owner Profile */}
        {currentStep === 1 && (
          <View style={styles.formSection}>
            <Input
              label="Owner Full Name *"
              placeholder="e.g. Ramesh Chandra"
              value={ownerName}
              onChangeText={setOwnerName}
              error={errors.ownerName}
              leftIcon="person-outline"
            />
            <Input
              label="Owner Mobile Number *"
              placeholder="e.g. 98450 12345"
              keyboardType="phone-pad"
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              error={errors.ownerPhone}
              leftIcon="call-outline"
            />
            <Input
              label="Business / Owner Email *"
              placeholder="e.g. owner@luxuryhair.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={ownerEmail}
              onChangeText={setOwnerEmail}
              error={errors.ownerEmail}
              leftIcon="mail-outline"
            />
          </View>
        )}

        {/* STEP 2: Salon Details */}
        {currentStep === 2 && (
          <View style={styles.formSection}>
            <Input
              label="Salon Brand Name *"
              placeholder="e.g. Velvet & Mane Salon"
              value={salonName}
              onChangeText={setSalonName}
              error={errors.salonName}
              leftIcon="business-outline"
            />
            <Input
              label="Street Address *"
              placeholder="e.g. 42, 100 Feet Road, Indiranagar"
              value={salonAddress}
              onChangeText={setSalonAddress}
              error={errors.salonAddress}
              leftIcon="location-outline"
            />
            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="City *"
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChangeText={setCity}
                  error={errors.city}
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Postal Code *"
                  placeholder="e.g. 560038"
                  keyboardType="number-pad"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  error={errors.postalCode}
                />
              </View>
            </View>
            <Input
              label="Salon Contact / Reception Phone *"
              placeholder="e.g. +91 80 4123 9800"
              keyboardType="phone-pad"
              value={salonContact}
              onChangeText={setSalonContact}
              error={errors.salonContact}
              leftIcon="call-outline"
            />
          </View>
        )}

        {/* STEP 3: Category & Business Details */}
        {currentStep === 3 && (
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Primary Salon Category *</Text>
            <View style={styles.categoryGrid}>
              {SALON_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    salonCategory === cat && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSalonCategory(cat)}
                >
                  <Ionicons
                    name={salonCategory === cat ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={salonCategory === cat ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      salonCategory === cat && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Business Registration / GSTIN / Trade License (Optional)"
              placeholder="e.g. 29AAAAA0000A1Z5"
              value={taxOrRegNumber}
              onChangeText={setTaxOrRegNumber}
              leftIcon="document-text-outline"
              autoCapitalize="characters"
            />

            <Input
              label="About Your Salon *"
              placeholder="Describe your services, hygiene standards, and resident team..."
              value={businessDescription}
              onChangeText={setBusinessDescription}
              error={errors.businessDescription}
              multiline
              numberOfLines={3}
            />

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreedToTerms ? colors.primary : colors.textTertiary}
              />
              <Text style={styles.termsText}>
                I agree to the Glamora Partner Terms, Zero-Waiting guarantee policy, and verified booking standards.
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </View>
        )}

        {/* Navigation Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep < 3 ? (
            <Button
              title="Continue to Next Step"
              onPress={handleNext}
              size="lg"
              rightIcon="arrow-forward"
            />
          ) : (
            <Button
              title="Submit Salon for Verification"
              onPress={handleSubmit}
              size="lg"
              loading={isSubmitting}
              rightIcon="shield-checkmark"
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepIndicator: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.md,
  },
  stepText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.borderLight,
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  stepHeader: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  col: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs + 2,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.xs + 1,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
});

