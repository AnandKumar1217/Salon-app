import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StylistCard } from '../../components/cards/StylistCard';
import { fetchSalonById } from '../../api/salonsApi';
import { getLiveAvailableSlots } from '../../api/bookingsApi';
import { useAuth } from '../../context/AuthContext';
import { useBookings } from '../../context/BookingsContext';
import { Salon, Staff, TimeSlot, PaymentMethod } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingFlow'>;

export const BookingFlowScreen: React.FC<Props> = ({ route, navigation }) => {
  const { salonId, preselectedServiceId } = route.params;
  const { user } = useAuth();
  const { createBooking } = useBookings();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | 'any'>('any');

  // Next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form details
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAY_AT_SALON');

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSalon();
  }, [salonId]);

  const loadSalon = async () => {
    const data = await fetchSalonById(salonId);
    if (data) {
      setSalon(data);
    }
  };

  useEffect(() => {
    if (salon && selectedDate) {
      fetchSlots();
    }
  }, [salon, selectedDate, selectedStaff]);

  const fetchSlots = async () => {
    if (!salon) return;
    try {
      setLoadingSlots(true);
      setErrorMessage(null);
      setSelectedSlot(null);

      const serviceIds = preselectedServiceId
        ? [preselectedServiceId]
        : salon.services?.map((s) => s.id).slice(0, 1) || [];

      const staffIdPref = selectedStaff === 'any' ? undefined : selectedStaff.id;

      const res = await getLiveAvailableSlots({
        salonId: salon.id,
        serviceIds,
        date: selectedDate,
        preferredStaffId: staffIdPref,
      });

      setSlots(res.slots);
    } catch (e: any) {
      setErrorMessage('Could not load slots for this date.');
    } finally {
      setLoadingSlots(false);
    }
  };

  if (!salon) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedService =
    salon.services?.find((s) => s.id === preselectedServiceId) || salon.services?.[0];
  const servicesToBook = selectedService ? [selectedService] : [];
  const subtotal = servicesToBook.reduce((acc, s) => acc + s.price, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + tax;

  const handleSubmitBooking = async () => {
    if (!selectedSlot) {
      setErrorMessage('Please select an appointment time.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please fill in your contact name and mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      // Determine staff
      let staffMember: Staff | undefined;
      if (selectedStaff !== 'any') {
        staffMember = selectedStaff;
      } else if (selectedSlot.staffId && salon.staff) {
        staffMember = salon.staff.find((st) => st.id === selectedSlot.staffId) || salon.staff[0];
      } else {
        staffMember = salon.staff?.[0];
      }

      if (!staffMember) {
        throw new Error('No stylist available for this slot.');
      }

      const booking = await createBooking({
        salonId: salon.id,
        salon,
        services: servicesToBook,
        staff: staffMember,
        date: selectedDate,
        startTime: selectedSlot.time,
        customerId: user?.id || 'usr_guest',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        notes: notes.trim(),
      });

      navigation.replace('BookingConfirmation', { bookingId: booking.id });
    } catch (err: any) {
      setErrorMessage(err.message || 'Slot was taken. Please select another time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Schedule Appointment" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Salon & Service Review Box */}
        <View style={styles.reviewBox}>
          <Text style={styles.salonTitle}>{salon.name}</Text>
          <Text style={styles.serviceName}>{selectedService?.name}</Text>
          <View style={styles.serviceMeta}>
            <Text style={styles.metaItem}>Duration: {selectedService?.durationMinutes} mins</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaItem}>Buffer: {salon.bufferMinutes || 10} mins</Text>
          </View>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Step 1: Choose Stylist */}
        <Text style={styles.sectionHeading}>1. Preferred Stylist</Text>
        <StylistCard
          isAnyAvailable
          isSelected={selectedStaff === 'any'}
          onSelect={() => setSelectedStaff('any')}
        />
        {salon.staff?.map((st) => (
          <StylistCard
            key={st.id}
            staff={st}
            isSelected={selectedStaff !== 'any' && selectedStaff.id === st.id}
            onSelect={() => setSelectedStaff(st)}
          />
        ))}

        {/* Step 2: Select Date */}
        <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>2. Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {availableDates.map((d) => {
            const dateObj = new Date(d + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const isSelected = selectedDate === d;

            return (
              <TouchableOpacity
                key={d}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>{dayName}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>{dayNum}</Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                  {monthName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step 3: Select Time Slot */}
        <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>
          3. Live Confirmed Time Slots
        </Text>
        {loadingSlots ? (
          <View style={styles.loadingSlots}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingSlotsText}>
              Verifying real-time staff calendar & walk-in availability...
            </Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.noSlots}>
            <Text style={styles.noSlotsText}>No slots available for this date. Please pick another date.</Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.time === slot.time;
              const isAvail = slot.available;

              return (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.slotPill,
                    !isAvail && styles.slotDisabled,
                    isSelected && styles.slotSelected,
                  ]}
                  disabled={!isAvail}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.slotTimeText,
                      !isAvail && styles.slotTextDisabled,
                      isSelected && styles.slotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 4: Customer Details */}
        <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>
          4. Contact Details
        </Text>
        <Input
          label="Your Name *"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Enter full name"
          leftIcon="person-outline"
        />
        <Input
          label="Mobile Phone *"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
          placeholder="e.g. 9845012345"
          leftIcon="call-outline"
          helperText="Booking reference will be sent here"
        />
        <Input
          label="Special Instructions / Hair Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Sensitive scalp, layered styling preference..."
          leftIcon="document-text-outline"
        />

        {/* Step 5: Payment Selection */}
        <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>
          5. Payment Option
        </Text>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'PAY_AT_SALON' && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod('PAY_AT_SALON')}
          activeOpacity={0.8}
        >
          <View style={styles.paymentRadio}>
            {paymentMethod === 'PAY_AT_SALON' && <View style={styles.radioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentTitle}>Pay at Salon</Text>
            <Text style={styles.paymentSubtitle}>
              Cash, UPI, or Credit/Debit Card at reception after service
            </Text>
          </View>
          <Ionicons name="storefront-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'ONLINE' && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod('ONLINE')}
          activeOpacity={0.8}
        >
          <View style={styles.paymentRadio}>
            {paymentMethod === 'ONLINE' && <View style={styles.radioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentTitle}>Pay Online (Instant UPI / Netbanking)</Text>
            <Text style={styles.paymentSubtitle}>Pre-paid contactless check-in</Text>
          </View>
          <Ionicons name="card-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Price Breakdown Card */}
        <View style={styles.priceBreakdown}>
          <Text style={styles.breakdownTitle}>Price Summary</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Service Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Estimated Salon Taxes & GST (5%)</Text>
            <Text style={styles.breakdownValue}>₹{tax}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Submit Booking Button */}
        <Button
          title={selectedSlot ? `Confirm Booking • ₹${totalAmount}` : 'Select a Slot to Continue'}
          onPress={handleSubmitBooking}
          disabled={!selectedSlot || submitting}
          loading={submitting}
          size="lg"
          style={styles.submitBtn}
        />

        <Text style={styles.disclaimerText}>
          🔒 Your appointment locks employee capacity immediately upon submission.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  reviewBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  salonTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaItem: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    marginHorizontal: 6,
    color: colors.borderDark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },
  sectionHeading: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  dateScroll: {
    marginBottom: spacing.md,
  },
  dateChip: {
    width: 60,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  loadingSlots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingSlotsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  noSlots: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotPill: {
    width: '31%',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotDisabled: {
    backgroundColor: colors.surfaceWarm,
    opacity: 0.35,
  },
  slotTimeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  slotTextDisabled: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5F7',
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceBreakdown: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.lg,
  },
  breakdownTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  breakdownLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '800',
    color: colors.primary,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
