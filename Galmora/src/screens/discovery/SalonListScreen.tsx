import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { SalonCard } from '../../components/cards/SalonCard';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { fetchSalons } from '../../api/salonsApi';
import { Salon } from '../../types';

type Props = any;

const CATEGORY_CHIPS = ['All', 'Hair & Styling', 'Color & Highlights', 'Facial & Glow', 'Nails & Mani-Pedi', 'Beard & Grooming', 'Spa & Head Massage'];
const PRICE_CHIPS = ['All', '$', '$$', '$$$'];

export const SalonListScreen: React.FC<Props> = ({ route, navigation }) => {
  const initialCategory = route.params?.category || 'All';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  useEffect(() => {
    loadSalons();
  }, [search, selectedCategory, selectedPrice, minRating]);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const data = await fetchSalons({
        query: search,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        priceLevel: selectedPrice === 'All' ? undefined : selectedPrice,
        minRating,
      });
      setSalons(data);
    } catch (e) {
      console.warn('Error fetching discovery salons:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedPrice('All');
    setMinRating(undefined);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Search Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.headerTitle}>Discover Salons</Text>
        <Input
          placeholder="Search by salon name, service or area..."
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
          rightIcon={search ? 'close-circle' : undefined}
          onRightIconPress={() => setSearch('')}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* Filter Chips Scroll */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Category Chips */}
          {CATEGORY_CHIPS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Rating 4.5+ Pill */}
          <TouchableOpacity
            style={[styles.chip, minRating === 4.5 && styles.chipSelected]}
            onPress={() => setMinRating(minRating === 4.5 ? undefined : 4.5)}
            activeOpacity={0.7}
          >
            <Ionicons name="star" size={12} color={minRating === 4.5 ? '#FFF' : '#D48B38'} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, minRating === 4.5 && styles.chipTextSelected]}>4.5+ Star</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCount}>
          Showing {salons.length} {salons.length === 1 ? 'salon' : 'salons'}
        </Text>
        {(selectedCategory !== 'All' || selectedPrice !== 'All' || minRating || search) && (
          <TouchableOpacity onPress={handleResetFilters}>
            <Text style={styles.resetFiltersText}>Reset filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Salons List */}
      <FlatList
        data={salons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SalonCard
            salon={item}
            onPress={() => navigation.navigate('SalonDetail', { salonId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="search-outline"
              title="No Salons Found"
              description="No salons match your search criteria. Try removing some filters or exploring other areas."
              actionLabel="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filtersWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resetFiltersText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
