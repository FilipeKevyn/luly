import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HardShadow } from '@/components/hard-shadow';
import { Text } from '@/components/text';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import { Brand, type ThemePalette } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import { getFeaturedMovie } from '@/data/movies';
import { showNotice } from '@/utils/feedback';

export default function EntradaScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const featured = getFeaturedMovie();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <MaterialIcons name="star" size={28} color={theme.onAccent} />
              <Text style={styles.brand}>luly</Text>
            </View>
            <ThemeToggle variant="onBrand" />
          </View>

          <Text style={styles.kicker}>DÊ O PLAY, COMPANHEIRO</Text>
          <Text style={styles.title}>Histórias que brilham com você.</Text>
          <Text style={styles.subtitle}>
            Filmes incríveis, descobertas certeiras e uma lista só sua.
          </Text>

          <HardShadow
            offset={6}
            radius={14}
            containerStyle={styles.promoWrapper}
            style={styles.promoFrame}
          >
            <Image
              source={{ uri: featured.hero }}
              style={styles.promoImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>NOVIDADES TODA SEMANA</Text>
            </View>
          </HardShadow>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pronto para dar play?</Text>
            <Text style={styles.cardSubtitle}>
              Entre e encontre o filme perfeito para agora.
            </Text>

            <HardShadow
              offset={5}
              radius={8}
              containerStyle={styles.buttonWrapper}
              style={styles.primaryButton}
            >
              <Pressable
                onPress={() => router.replace("/(tabs)/inicio")}
                style={({ pressed }) => [
                  styles.primaryPress,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons name="star" size={18} color={theme.onAccent} />
                <Text style={styles.primaryLabel}>ENTRAR NA LULY</Text>
              </Pressable>
            </HardShadow>

            <HardShadow
              offset={5}
              radius={8}
              containerStyle={styles.buttonWrapper}
              style={styles.secondaryButton}
            >
              <Pressable
                onPress={() => showNotice("Disponível em breve.")}
                style={({ pressed }) => [
                  styles.secondaryPress,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryLabel}>Criar minha conta</Text>
              </Pressable>
            </HardShadow>

            <Text style={styles.terms}>
              Ao continuar, você aceita os Termos de Uso e a Política de
              Privacidade.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Brand.red,
    },
    safe: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 18,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brand: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "900",
      color: theme.onAccent,
      letterSpacing: 0.5,
    },
    kicker: {
      marginTop: 30,
      ...TypeScale.caption,
      fontWeight: "900",
      letterSpacing: 2,
      color: theme.highlight,
    },
    title: {
      marginTop: 10,
      ...TypeScale.display,
      fontWeight: "900",
      color: theme.onAccent,
    },
    subtitle: {
      marginTop: 12,
      ...TypeScale.bodyLarge,
      color: "rgba(255, 255, 255, 0.9)",
    },
    promoWrapper: {
      marginTop: 26,
      marginBottom: 20,
    },
    promoFrame: {
      borderRadius: 14,
      backgroundColor: theme.mediaBackground,
    },
    promoImage: {
      width: "100%",
      aspectRatio: 4 / 3,
      borderRadius: 14,
    },
    promoBadge: {
      position: "absolute",
      right: 14,
      bottom: 14,
      backgroundColor: theme.highlight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 3,
      borderWidth: 2,
      borderColor: Brand.black,
    },
    promoBadgeText: {
      ...TypeScale.micro,
      fontWeight: "900",
      letterSpacing: 1,
      color: Brand.black,
    },
    card: {
      flexGrow: 1,
      backgroundColor: theme.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      marginHorizontal: -22,
      paddingHorizontal: 26,
      paddingTop: 28,
      paddingBottom: 40,
      gap: 12,
    },
    cardTitle: {
      ...TypeScale.cardHeadline,
      fontWeight: "900",
      color: theme.text,
    },
    cardSubtitle: {
      ...TypeScale.bodyLarge,
      color: theme.textMuted,
      marginBottom: 8,
    },
    buttonWrapper: {
      marginBottom: 4,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 8,
    },
    primaryPress: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 18,
    },
    primaryLabel: {
      ...TypeScale.buttonLarge,
      color: theme.onAccent,
      fontWeight: "900",
      letterSpacing: 1.5,
    },
    secondaryButton: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.border,
    },
    secondaryPress: {
      alignItems: "center",
      paddingVertical: 16,
    },
    secondaryLabel: {
      ...TypeScale.buttonLarge,
      color: theme.text,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    terms: {
      marginTop: 10,
      ...TypeScale.label,
      color: theme.textMuted,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.85,
    },
  });
