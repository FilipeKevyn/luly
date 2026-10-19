import { MaterialIcons } from '@expo/vector-icons';
import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Brand } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';

type TabButtonProps = TabTriggerSlotProps & {
  icon: keyof typeof MaterialIcons.glyphMap;
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="inicio" href="/inicio" asChild>
            <TabButton icon="home">Início</TabButton>
          </TabTrigger>
          <TabTrigger name="minha-lista" href="/minha-lista" asChild>
            <TabButton icon="bookmark">Listas</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ icon, isFocused, children, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={styles.tabButton}>
      <MaterialIcons name={icon} size={20} color={isFocused ? Brand.red : Brand.muted} />
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{children}</Text>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    flexGrow: 1,
    paddingVertical: 12,
    backgroundColor: Brand.paper,
    borderTopWidth: 2,
    borderColor: Brand.black,
  },
  tabButton: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
  },
  tabLabel: {
    ...TypeScale.label,
    fontWeight: '800',
    color: Brand.muted,
  },
  tabLabelActive: {
    color: Brand.red,
  },
});
