import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { POPULAR_LOCATIONS, useLocation, LocationArea } from '../../context/LocationContext';
import { Input } from './Input';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ visible, onClose }) => {
  const { currentArea, currentCity, setLocation, useCurrentGps, isGpsActive } = useLocation();
  const [search, setSearch] = useState('');

  const filtered = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (loc: LocationArea) => {
    setLocation(loc.name, loc.city);
    onClose();
  };

  const handleGps = () => {
    useCurrentGps();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text style={styles.title}>Choose Location</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Input
                placeholder="Search city or area..."
                value={search}
                onChangeText={setSearch}
                leftIcon="search-outline"
                containerStyle={{ marginBottom: spacing.md }}
              />

              <TouchableOpacity style={styles.gpsRow} onPress={handleGps} activeOpacity={0.7}>
                <View style={styles.gpsIconBox}>
                  <Ionicons name="navigate" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsTitle}>Use Current Location</Text>
                  <Text style={styles.gpsSubtitle}>Enable GPS for precise salon distances</Text>
                </View>
                {isGpsActive && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>Popular Areas</Text>

              <FlatList
                data={filtered}
                keyExtractor={(item) => `${item.name}-${item.city}`}
                renderItem={({ item }) => {
                  const isSelected = item.name === currentArea && item.city === currentCity;
                  return (
                    <TouchableOpacity
                      style={[styles.locationItem, isSelected && styles.selectedItem]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: spacing.md }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.locationName, isSelected && styles.selectedText]}>
                          {item.name}
                        </Text>
                        <Text style={styles.cityName}>{item.city}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  gpsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  gpsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  gpsSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectedItem: {
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cityName: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

