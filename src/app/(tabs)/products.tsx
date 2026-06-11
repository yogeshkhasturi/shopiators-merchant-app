import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import WebViewContainer from '../../components/WebViewContainer';
import Header from '../../components/Header';

export default function ProductsTab() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Header variant="products" title="Products" />
      <WebViewContainer path="/admin/products" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
