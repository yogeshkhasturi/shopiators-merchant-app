import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import WebViewContainer from '../../components/WebViewContainer';
import Header from '../../components/Header';

export default function CustomersTab() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Header variant="customers" title="Customers" />
      <WebViewContainer path="/admin/customers" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
