import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import WebViewContainer from '../components/WebViewContainer';
import { ArrowLeft } from 'lucide-react-native';

const ArrowLeftIcon = ArrowLeft as any;

export default function GenericWebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const path = params.path as string;
  const title = (params.title as string) || 'Admin Settings';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      
      {/* Premium Back Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <ArrowLeftIcon size={20} color="#cbd5e1" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Embedded WebView Container */}
      <View style={styles.webViewWrapper}>
        <WebViewContainer path={path} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#090d16',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  placeholder: {
    width: 36,
  },
  webViewWrapper: {
    flex: 1,
  },
});
