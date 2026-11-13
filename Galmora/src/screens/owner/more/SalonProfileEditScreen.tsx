import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export const SalonProfileEditScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { salon, updateSalonProfile } = useOwnerSalon();

  const [name, setName] = useState(salon?.name || 'Maison De Belle');
  const [tagline, setTagline] = useState(salon?.tagline || 'Luxury Hair Lounge & Aesthetic Bar');
  const [phone, setPhone] = useState(salon?.phone || '+91 80 4123 9801');
  const [whatsapp, setWhatsapp] = useState(salon?.whatsappNumber || '+91 98451 98012');
  const [address, setAddress] = useState(
    salon?.address || '42, 100 Feet Road, HAL 2nd Stage, Indiranagar'
  );
  const [area, setArea] = useState(salon?.area || 'Indiranagar');
  const [city, setCity] = useState(salon?.city || 'Bengaluru');
  const [bufferMinutes, setBufferMinutes] = useState(String(salon?.bufferMinutes || 10));
  const [cancellationHours, setCancellationHours] = useState(
    String(salon?.cancellationWindowHours || 2)
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateSalonProfile({
        name,
        tagline,
        phone,
        whatsappNumber: whatsapp,
        address,
        area,
        city,
        bufferMinutes: Number(bufferMinutes) || 10,
        cancellationWindowHours: Number(cancellationHours) || 2,
      });

      Alert.alert('Settings Saved', 'Your salon profile and booking policies have been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update salon profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Salon Profile & Policies</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Basic Information</Text>
        <Input
          label="Salon Brand Name *"
          value={name}
          onChangeText={setName}
          leftIcon="business-outline"
        />
        <Input
          label="Tagline *"
          value={tagline}
          onChangeText={setTagline}
          leftIcon="sparkles-outline"
        />

        <Text style={styles.sectionHeading}>Customer Contact Details</Text>
        <Input
          label="Reception Contact Number *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <Input
          label="Verified WhatsApp Number for Inquiries *"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          leftIcon="logo-whatsapp"
        />

        <Text style={styles.sectionHeading}>Location</Text>
        <Input
          label="Physical Street Address *"
          value={address}
          onChangeText={setAddress}
          leftIcon="location-outline"
        />
        <View style={styles.row}>
          <View style={styles.col}>
            <Input label="Area / Locality *" value={area} onChangeText={setArea} />
          </View>
          <View style={styles.col}>
            <Input label="City *" value={city} onChangeText={setCity} />
          </View>
        </View>

        <Text style={styles.sectionHeading}>Zero-Waiting & Booking Policies</Text>
        <Input
          label="Styling Chair Buffer Time (Minutes) *"
          value={bufferMinutes}
          onChangeText={setBufferMinutes}
          keyboardType="number-pad"
          helperText="Automatic rest window inserted between back-to-back appointments"
          leftIcon="hourglass-outline"
        />
        <Input
          label="Cancellation Policy Window (Hours) *"
          value={cancellationHours}
          onChangeText={setCancellationHours}
          keyboardType="number-pad"
          helperText="Hours before scheduled time a customer is permitted to cancel or reschedule"
          leftIcon="time-outline"
        />

        <Button
          title="Save Salon Profile Changes"
          onPress={handleSave}
          size="lg"
          loading={loading}
          variant="primary"
          style={styles.saveBtn}
        />
      </ScrollView>
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
    paddingTop: STATUS_BAR_HEIGHT + 10,
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textTertiary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  col: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.lg,
  },
});

