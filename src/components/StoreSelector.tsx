import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useSessionStore } from '../store/useSessionStore';
import { Store, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { appBridge } from '../services/app-bridge';

const StoreIcon = Store as any;
const ChevronRightIcon = ChevronRight as any;

export default function StoreSelectorScreen() {
  const { availableStores, token, refreshToken, expiresAt, domain, merchantMetadata, setSession } = useSessionStore();
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  const handleSelectStore = async (store: any) => {
    if (isSelecting) return;
    setIsSelecting(store.slug);
    appBridge.executeHaptic('selection');
    
    // Slight delay for animation effect
    setTimeout(async () => {
      // Finalize session with the selected merchantSlug
      await setSession(
          token as string,
          refreshToken,
          expiresAt,
          store.slug,
          domain,
          merchantMetadata
        );
      appBridge.executeHaptic('success');
    }, 400);
  };

  if (!availableStores || availableStores.length === 0) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.title}>Select a store</Text>
          <Text style={styles.subtitle}>Choose which business you want to manage.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.listContainer}>
          {availableStores.map((store, index) => (
            <StoreCard 
              key={store.slug} 
              store={store} 
              isSelecting={isSelecting === store.slug}
              onPress={() => handleSelectStore(store)}
            />
          ))}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const StoreCard = ({ store, isSelecting, onPress }: { store: StoreIdentity, isSelecting: boolean, onPress: () => void }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelecting ? 0.98 : 1) }],
      opacity: withSpring(isSelecting ? 0.8 : 1),
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.iconContainer}>
          <StoreIcon size={22} color="#ffffff" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeRole}>{store.role.charAt(0).toUpperCase() + store.role.slice(1)} • {store.slug}.shopiators.com</Text>
        </View>
        <View style={styles.actionContainer}>
          {isSelecting ? (
            <ActivityIndicator size="small" color="#818cf8" />
          ) : (
            <ChevronRightIcon size={20} color="#475569" />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // Pure dark theme
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '400',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  storeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  storeRole: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  actionContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
});
