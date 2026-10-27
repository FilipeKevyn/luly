import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { HardShadow } from '@/components/hard-shadow';
import { Text } from '@/components/text';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import { FontFamily, TypeScale } from '@/constants/typography';
import type { ThemePalette } from '@/constants/theme';
import type { Movie } from '@/data/movies';
import {
  addFilmeALista,
  createLista,
  getListasComFilme,
  listListasComContagem,
  removeFilmeDaLista,
  USUARIO_DEMO_ID,
  type ListaComContagem,
} from '@/db/repositories';
import { showNotice } from '@/utils/feedback';

type AddToListSheetProps = {
  movie: Movie | null;
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

export function AddToListSheet({ movie, visible, onClose, onChanged }: AddToListSheetProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [lists, setLists] = useState<ListaComContagem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  function handleClose() {
    setLoading(true);
    setCreating(false);
    setNewName('');
    onClose();
  }

  useEffect(() => {
    if (!visible || !movie) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const [allLists, listsWithMovie] = await Promise.all([
          listListasComContagem(USUARIO_DEMO_ID),
          getListasComFilme(USUARIO_DEMO_ID, movie.id),
        ]);
        if (!active) {
          return;
        }
        setLists(allLists);
        setSelectedIds(listsWithMovie.map((lista) => lista.id));
      } catch {
        if (active) {
          showNotice('Não foi possível carregar suas listas.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [visible, movie]);

  async function toggleLista(lista: ListaComContagem) {
    if (!movie || busy) {
      return;
    }
    setBusy(true);
    try {
      if (selectedIds.includes(lista.id)) {
        await removeFilmeDaLista(lista.id, movie.id);
        setSelectedIds((current) => current.filter((id) => id !== lista.id));
      } else {
        await addFilmeALista(lista.id, movie.id);
        setSelectedIds((current) => [...current, lista.id]);
        showNotice(`Adicionado a ${lista.nome}`);
      }
      onChanged?.();
    } catch {
      showNotice('Não foi possível atualizar a lista.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmarNovaLista() {
    if (!movie || busy) {
      return;
    }
    const nome = newName.trim();
    if (!nome) {
      showNotice('Dê um nome para a lista.');
      return;
    }
    setBusy(true);
    try {
      const lista = await createLista(USUARIO_DEMO_ID, nome);
      await addFilmeALista(lista.id, movie.id);
      setLists((current) => [...current, { ...lista, total: 1 }]);
      setSelectedIds((current) => [...current, lista.id]);
      setNewName('');
      setCreating(false);
      showNotice(`Adicionado a ${lista.nome}`);
      onChanged?.();
    } catch {
      showNotice('Não foi possível criar a lista.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerTexts}>
              <Text style={styles.kicker}>ADICIONAR À LISTA</Text>
              <Text style={styles.title} numberOfLines={1}>
                {movie?.title ?? ''}
              </Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <View style={styles.list}>
              {lists.map((lista) => {
                const checked = selectedIds.includes(lista.id);
                return (
                  <Pressable
                    key={lista.id}
                    onPress={() => toggleLista(lista)}
                    style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? (
                        <MaterialIcons name="check" size={16} color={theme.onAccent} />
                      ) : null}
                    </View>
                    <Text style={styles.listName} numberOfLines={1}>
                      {lista.nome}
                    </Text>
                    <Text style={styles.listCount}>{lista.total}</Text>
                  </Pressable>
                );
              })}

              {lists.length === 0 ? (
                <Text style={styles.emptyText}>
                  Você ainda não tem listas. Crie a primeira para guardar este filme.
                </Text>
              ) : null}

              {creating ? (
                <View style={styles.createBox}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Nome da lista"
                    placeholderTextColor={theme.textMuted}
                    selectionColor={theme.accent}
                    style={styles.input}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={confirmarNovaLista}
                  />
                  <Pressable
                    onPress={confirmarNovaLista}
                    style={({ pressed }) => [styles.createConfirm, pressed && styles.pressed]}>
                    <Text style={styles.createConfirmLabel}>Criar</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setCreating(true)}
                  style={({ pressed }) => [styles.newListRow, pressed && styles.pressed]}>
                  <View style={styles.plusBox}>
                    <MaterialIcons name="add" size={18} color={theme.text} />
                  </View>
                  <Text style={styles.newListLabel}>Criar nova lista</Text>
                </Pressable>
              )}
            </View>
          )}

          <HardShadow offset={4} radius={8} containerStyle={styles.confirmWrapper} style={styles.confirmButton}>
            <Pressable onPress={handleClose} style={styles.confirmPress}>
              <Text style={styles.confirmLabel}>CONCLUÍDO</Text>
            </Pressable>
          </HardShadow>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.backdrop,
    },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 32,
      gap: 14,
      borderTopWidth: 2,
      borderColor: theme.border,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.borderSubtle,
      marginBottom: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTexts: {
      flex: 1,
      gap: 2,
    },
    kicker: {
      ...TypeScale.micro,
      fontWeight: '900',
      letterSpacing: 1.5,
      color: theme.accent,
    },
    title: {
      ...TypeScale.modalTitle,
      fontWeight: '900',
      color: theme.text,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    loadingBox: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    list: {
      gap: 10,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    checkboxChecked: {
      backgroundColor: theme.accent,
      borderColor: theme.border,
    },
    listName: {
      flex: 1,
      ...TypeScale.bodyLarge,
      fontWeight: '800',
      color: theme.text,
    },
    listCount: {
      ...TypeScale.caption,
      fontWeight: '800',
      color: theme.textMuted,
    },
    emptyText: {
      ...TypeScale.subtitle,
      color: theme.textMuted,
      paddingVertical: 6,
    },
    createBox: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: FontFamily.bold,
      color: theme.text,
      backgroundColor: theme.surface,
    },
    createConfirm: {
      backgroundColor: theme.accent,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
      paddingHorizontal: 18,
      paddingVertical: 13,
    },
    createConfirmLabel: {
      color: theme.onAccent,
      ...TypeScale.button,
      fontWeight: '900',
      letterSpacing: 1,
    },
    newListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },
    plusBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newListLabel: {
      ...TypeScale.body,
      fontWeight: '800',
      color: theme.text,
    },
    confirmWrapper: {
      marginTop: 4,
    },
    confirmButton: {
      backgroundColor: theme.accent,
      borderRadius: 8,
    },
    confirmPress: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    confirmLabel: {
      color: theme.onAccent,
      ...TypeScale.buttonLarge,
      fontWeight: '900',
      letterSpacing: 1.5,
    },
    pressed: {
      opacity: 0.85,
    },
  });
