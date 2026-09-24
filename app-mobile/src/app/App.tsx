import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Page1() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Página 1</Text>
      <Text style={styles.subtitle}>Teste inicial</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
  },
});
