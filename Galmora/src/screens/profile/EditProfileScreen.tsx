import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      Alert.alert('Profile Updated', 'Your profile details have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Edit Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Full Name *"
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
          leftIcon="person-outline"
          error={error || undefined}
        />

        <Input
          label="Mobile Phone *"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter mobile phone"
          leftIcon="call-outline"
        />

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          leftIcon="mail-outline"
          keyboardType="email-address"
        />

        <Button
          title="Save Changes"
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
  content: {
    padding: spacing.xl,
  },
  saveBtn: {
    marginTop: spacing.lg,
  },
});
