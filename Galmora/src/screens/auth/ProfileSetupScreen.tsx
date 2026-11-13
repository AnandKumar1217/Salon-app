import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
];

export const ProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        gender,
        avatarUrl: selectedAvatar,
      });

      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Complete Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Image source={{ uri: selectedAvatar }} style={styles.mainAvatar} />
          <Text style={styles.avatarTitle}>Choose Your Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.avatarChoice,
                  selectedAvatar === uri && styles.avatarSelected,
                ]}
                onPress={() => setSelectedAvatar(uri)}
              >
                <Image source={{ uri }} style={styles.choiceImg} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name *"
            placeholder="e.g. Radhika Sharma"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            leftIcon="person-outline"
            error={error || undefined}
          />

          <Input
            label="Email Address (Optional)"
            placeholder="For appointment receipts & updates"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <Text style={styles.label}>Personalized Recommendations</Text>
          <View style={styles.genderRow}>
            {(['female', 'male', 'other'] as const).map((g) => {
              const isSelected = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, isSelected && styles.genderBtnSelected]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={g === 'female' ? 'woman' : g === 'male' ? 'man' : 'people'}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.textPrimary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.genderText, isSelected && styles.genderTextSelected]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Start Exploring Salons"
          onPress={handleSave}
          loading={loading}
          size="lg"
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
  scrollContent: {
    padding: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mainAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatarTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatarChoice: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarSelected: {
    borderColor: colors.primary,
  },
  choiceImg: {
    width: '100%',
    height: '100%',
  },
  form: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
