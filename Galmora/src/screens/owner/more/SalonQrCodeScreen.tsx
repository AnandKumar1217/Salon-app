import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { Button } from '../../../components/common/Button';
import { safeGoBack, useHardwareBackHandler } from '../../../utils/navigationUtils';

export const SalonQrCodeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { salon, updateSalonProfile } = useOwnerSalon();

  const [slug, setSlug] = useState(salon?.slug || 'maison-de-belle');
  const [copied, setCopied] = useState(false);

  const publicUrl = `https://glamora.example/salon/${slug}`;

  const handleCopyLink = () => {
    Clipboard.setString(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    Alert.alert('Link Copied 📋', `Shareable booking URL copied:\n${publicUrl}`);
  };

  const handleShareWhatsApp = () => {
    const text = `Book your next salon appointment at *${salon?.name || 'Maison De Belle'}* with zero waiting! 💇✨ Reserve your stylist here: ${publicUrl}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
      Share.share({
        message: text,
        title: `Book an appointment at ${salon?.name}`,
        url: publicUrl,
      });
    });
  };

  const handleSystemShare = async () => {
    try {
      await Share.share({
        message: `Book appointments online at ${salon?.name || 'our salon'} with live stylist availability: ${publicUrl}`,
        url: publicUrl,
        title: `Online Booking — ${salon?.name}`,
      });
    } catch (e: any) {
      // ignore
    }
  };

  const handleBack = () => {
    safeGoBack(navigation, 'OwnerTabs', { screen: 'MoreTab' });
  };

  useHardwareBackHandler(() => {
    handleBack();
    return true;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Public Booking Link & QR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Text style={styles.pageHeading}>Your Shareable Booking Link</Text>
        <Text style={styles.pageSub}>
          Share this link on your Instagram bio, Google Maps listing, or WhatsApp status. Clients
          can book without installing the app!
        </Text>

        {/* QR Code Presentation Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrTop}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandLetter}>G</Text>
            </View>
            <Text style={styles.qrSalonName}>{salon?.name || 'Maison De Belle'}</Text>
            <Text style={styles.qrTagline}>Instant Booking • Zero Waiting</Text>
          </View>

          {/* Visual QR Graphic representation */}
          <View style={styles.qrCodeFrame}>
            <View style={styles.qrGrid}>
              {/* Corner position markers */}
              <View style={[styles.qrCorner, styles.qrTopLeft]} />
              <View style={[styles.qrCorner, styles.qrTopRight]} />
              <View style={[styles.qrCorner, styles.qrBottomLeft]} />

              <View style={styles.qrCenterBadge}>
                <Ionicons name="sparkles" size={24} color={colors.primary} />
                <Text style={styles.qrCenterText}>SCAN</Text>
              </View>
            </View>
          </View>

          <Text style={styles.qrHint}>Scan with any camera or QR scanner to book</Text>
        </View>

        {/* URL Box */}
        <View style={styles.urlBox}>
          <View style={styles.urlIconCircle}>
            <Ionicons name="link" size={18} color={colors.primary} />
          </View>
          <Text style={styles.urlText} numberOfLines={1}>
            {publicUrl}
          </Text>
          <TouchableOpacity onPress={handleCopyLink} style={styles.copyBtn}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={18}
              color={copied ? colors.success : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareBlock}>
          <TouchableOpacity
            style={styles.whatsAppShareBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.88}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsAppBtnText}>Share to WhatsApp Status & Bio</Text>
          </TouchableOpacity>

          <Button
            title="Share via Instagram / SMS / Socials"
            onPress={handleSystemShare}
            variant="outline"
            size="lg"
            leftIcon="share-social-outline"
            style={styles.systemShareBtn}
          />
        </View>

        {/* Slug Customization Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <View style={styles.infoTextCol}>
            <Text style={styles.infoTitle}>Unique Salon Handle</Text>
            <Text style={styles.infoSub}>
              Your slug is: <Text style={styles.bold}>{slug}</Text>. Supported by Android App Links
              so customers with Glamora installed open directly into your salon view.
            </Text>
          </View>
        </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    alignItems: 'center',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  pageHeading: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pageSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  qrCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  qrTop: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  brandLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FAF7F2',
    fontStyle: 'italic',
  },
  qrSalonName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  qrTagline: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrCodeFrame: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  qrGrid: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    position: 'relative',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCorner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderWidth: 5,
    borderColor: colors.textPrimary,
    borderRadius: 4,
  },
  qrTopLeft: {
    top: 4,
    left: 4,
  },
  qrTopRight: {
    top: 4,
    right: 4,
  },
  qrBottomLeft: {
    bottom: 4,
    left: 4,
  },
  qrCenterBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  urlBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  urlIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  urlText: {
    flex: 1,
    fontSize: typography.fontSize.xs + 1,
    color: colors.primary,
    fontWeight: '600',
  },
  copyBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  shareBlock: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsapp,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  systemShareBtn: {
    width: '100%',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryMuted,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    width: '100%',
    gap: spacing.sm,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  infoSub: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '800',
  },
});

