import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/text';
import { Brand } from '@/constants/theme';
import { FontFamily, TypeScale } from '@/constants/typography';
import { createLista, USUARIO_DEMO_ID, type Lista } from '@/db/repositories';
import { showNotice } from '@/utils/feedback';

type CreateListModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (lista: Lista) => void;
};

export function CreateListModal({ visible, onClose, onCreated }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  function close() {
    setName('');
    onClose();
  }

  async function handleCreate() {
    if (busy) {
      return;
    }
    const nome = name.trim();
    if (!nome) {
      showNotice('Dê um nome para a lista.');
      return;
    }
    setBusy(true);
    try {
      const lista = await createLista(USUARIO_DEMO_ID, nome);
      setName('');
      onCreated?.(lista);
      onClose();
    } catch {
      showNotice('Não foi possível criar a lista.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.card}>
          <Text style={styles.title}>Nova lista</Text>
          <Text style={styles.subtitle}>Dê um nome para guardar seus títulos.</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Favoritos da semana"
            placeholderTextColor={Brand.muted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={styles.actions}>
            <Pressable onPress={close} style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
              <Text style={styles.ghostLabel}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryLabel}>Criar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    width: '100%',
    backgroundColor: Brand.paper,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Brand.black,
    padding: 20,
    gap: 12,
  },
  title: {
    ...TypeScale.modalTitle,
    fontWeight: '900',
    color: Brand.ink,
  },
  subtitle: {
    ...TypeScale.subtitle,
    color: Brand.muted,
  },
  input: {
    borderWidth: 2,
    borderColor: Brand.black,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Brand.ink,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  ghostButton: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.black,
  },
  ghostLabel: {
    ...TypeScale.button,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.ink,
  },
  primaryButton: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.red,
  },
  primaryLabel: {
    ...TypeScale.button,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.paper,
  },
  pressed: {
    opacity: 0.85,
  },
});
