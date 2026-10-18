import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HardShadow } from '@/components/hard-shadow';
import { Brand } from '@/constants/theme';
import { getFeaturedMovie } from '@/data/movies';
import { showNotice } from '@/utils/feedback';

export default function EntradaScreen() {
  const featured = getFeaturedMovie();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <MaterialIcons name="star" size={28} color={Brand.paper} />
            <Text style={styles.brand}>luly</Text>
          </View>

          <Text style={styles.kicker}>SEU CINEMA, SUA ÓRBITA</Text>
          <Text style={styles.title}>Histórias que brilham com você.</Text>
          <Text style={styles.subtitle}>Filmes incríveis, descobertas certeiras e uma lista só sua.</Text>

          <HardShadow offset={6} radius={14} containerStyle={styles.promoWrapper} style={styles.promoFrame}>
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
            <Text style={styles.cardTitle}>Pronta para dar play?</Text>
            <Text style={styles.cardSubtitle}>Entre e encontre o filme perfeito para agora.</Text>

            <HardShadow offset={5} radius={8} containerStyle={styles.buttonWrapper} style={styles.primaryButton}>
              <Pressable
                onPress={() => router.replace('/(tabs)/inicio')}
                style={({ pressed }) => [styles.primaryPress, pressed && styles.pressed]}>
                <MaterialIcons name="star" size={18} color={Brand.paper} />
                <Text style={styles.primaryLabel}>ENTRAR NA LULY</Text>
              </Pressable>
            </HardShadow>

            <HardShadow offset={5} radius={8} containerStyle={styles.buttonWrapper} style={styles.secondaryButton}>
              <Pressable
                onPress={() => showNotice('Disponível em breve.')}
                style={({ pressed }) => [styles.secondaryPress, pressed && styles.pressed]}>
                <Text style={styles.secondaryLabel}>Criar minha conta</Text>
              </Pressable>
            </HardShadow>

            <Text style={styles.terms}>
              Ao continuar, você aceita os Termos de Uso e a Política de Privacidade.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    color: Brand.paper,
    letterSpacing: 0.5,
  },
  kicker: {
    marginTop: 30,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: Brand.yellow,
  },
  title: {
    marginTop: 10,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: Brand.paper,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  promoWrapper: {
    marginTop: 26,
    marginBottom: 20,
  },
  promoFrame: {
    borderRadius: 14,
    backgroundColor: Brand.black,
  },
  promoImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
  },
  promoBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: Brand.yellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Brand.black,
  },
  promoBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.black,
  },
  card: {
    flexGrow: 1,
    backgroundColor: Brand.paper,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginHorizontal: -22,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 12,
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Brand.ink,
  },
  cardSubtitle: {
    fontSize: 15,
    color: Brand.muted,
    marginBottom: 8,
  },
  buttonWrapper: {
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: Brand.red,
    borderRadius: 8,
  },
  primaryPress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  primaryLabel: {
    color: Brand.paper,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  secondaryButton: {
    backgroundColor: Brand.paper,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.black,
  },
  secondaryPress: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  secondaryLabel: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  terms: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: Brand.muted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
