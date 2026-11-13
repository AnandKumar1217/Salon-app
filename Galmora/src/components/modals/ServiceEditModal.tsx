import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useOwnerSalon } from '../../context/OwnerSalonContext';
import { ServiceItem } from '../../types';

interface ServiceEditModalProps {
  visible: boolean;
  serviceToEdit?: ServiceItem | null;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  'Hair & Styling',
  'Color & Highlights',
  'Facial & Glow',
  'Nails & Mani-Pedi',
  'Beard & Grooming',
  'Spa & Head Massage',
];

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({
  visible,
  serviceToEdit,
  onClose,
}) => {
  const { addOrUpdateService } = useOwnerSalon();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [price, setPrice] = useState('1200');
  const [duration, setDuration] = useState('45');
  const [buffer, setBuffer] = useState('10');
  const [description, setDescription] = useState('');
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name);
      setCategory(serviceToEdit.category);
      setPrice(String(serviceToEdit.price));
      setDuration(String(serviceToEdit.durationMinutes));
      setBuffer(String(serviceToEdit.bufferMinutes || 10));
      setDescription(serviceToEdit.description || '');
      setOnlineEnabled(serviceToEdit.isOnlineBookingEnabled ?? true);
    } else {
      setName('');
      setCategory(CATEGORY_OPTIONS[0]);
      setPrice('950');
      setDuration('45');
      setBuffer('10');
      setDescription('');
      setOnlineEnabled(true);
    }
  }, [serviceToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter service name.');
      return;
    }

    try {
      setLoading(true);
      await addOrUpdateService({
        id: serviceToEdit ? serviceToEdit.id : undefined,
        name: name.trim(),
        category,
        price: Number(price) || 500,
        durationMinutes: Number(duration) || 30,
        bufferMinutes: Number(buffer) || 10,
        description: description.trim() || 'Professional salon service.',
        isOnlineBookingEnabled: onlineEnabled,
        gender: 'unisex',
      });

      Alert.alert(
        serviceToEdit ? 'Service Updated' : 'Service Created',
        `${name} is now updated in your live salon menu.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {serviceToEdit ? 'Edit Treatment & Price' : 'Add New Salon Treatment'}
              </Text>
              <Text style={styles.subtitle}>Pricing, Duration & Buffer Rules</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Input
              label="Treatment Name *"
              placeholder="e.g. Balayage & Gloss Finish"
              value={name}
              onChangeText={setName}
              leftIcon="sparkles-outline"
            />

            {/* Category selection */}
            <Text style={styles.sectionLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="Price (₹) *"
                  placeholder="1200"
                  keyboardType="number-pad"
                  value={price}
                  onChangeText={setPrice}
                  leftIcon="cash-outline"
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Duration (Mins) *"
                  placeholder="45"
                  keyboardType="number-pad"
                  value={duration}
                  onChangeText={setDuration}
                  leftIcon="time-outline"
                />
              </View>
            </View>

            <Input
              label="Buffer Rest Time After Service (Mins) *"
              placeholder="10"
              keyboardType="number-pad"
              value={buffer}
              onChangeText={setBuffer}
              helperText="Zero-waiting safety buffer before next customer can book"
              leftIcon="hourglass-outline"
            />

            <Input
              label="Treatment Description"
              placeholder="e.g. Includes hair wash, consultation, and styling."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              style={styles.onlineToggleRow}
              onPress={() => setOnlineEnabled(!onlineEnabled)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={onlineEnabled ? 'checkbox' : 'square-outline'}
                size={22}
                color={onlineEnabled ? colors.primary : colors.textTertiary}
              />
              <View style={styles.onlineToggleInfo}>
                <Text style={styles.onlineToggleTitle}>Enable Online & WhatsApp Booking</Text>
                <Text style={styles.onlineToggleSub}>
                  When active, clients can select this service through your public booking link.
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              title={serviceToEdit ? 'Save Treatment Changes' : 'Publish Treatment'}
              onPress={handleSave}
              size="lg"
              loading={loading}
              variant="primary"
              style={styles.actionBtn}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing.xxl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  catChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  catChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  col: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  onlineToggleInfo: {
    flex: 1,
  },
  onlineToggleTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  onlineToggleSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: spacing.md,
  },
});

