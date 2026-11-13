import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { SalonCard } from '../../components/cards/SalonCard';
import { EmptyState } from '../../components/common/EmptyState';
import { fetchSalons } from '../../api/salonsApi';
import { useAuth } from '../../context/AuthContext';
import { Salon } from '../../types';

type Props = any;

export const SavedSalonsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, [user?.savedSalonIds]);

  const loadSaved = async () => {
    try {
      setLoading(true);
      const all = await fetchSalons();
      const savedIds = user?.savedSalonIds || [];
      const filtered = all.filter((s) => savedIds.includes(s.id));
      setSalons(filtered);
    } catch (e) {
      console.warn('Error loading saved salons:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Saved Salons" onBack={() => navigation.goBack()} />

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
              icon="heart-outline"
              title="No Saved Salons"
              description="Save your favorite boutique salons by tapping the heart icon on any salon page."
              actionLabel="Explore Salons"
              onAction={() => navigation.navigate('MainTabs', { screen: 'ExploreTab' })}
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
});
