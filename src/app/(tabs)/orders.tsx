import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import WebViewContainer from '../../components/WebViewContainer';

export default function OrdersTab() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <WebViewContainer path="/admin/orders" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
