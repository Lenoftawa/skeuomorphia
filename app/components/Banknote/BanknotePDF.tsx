import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface BanknotePDFProps {
  amount: number;
  currency: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  }
});

const BanknotePDF: React.FC<BanknotePDFProps> = ({ amount, currency }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>Skeuomorphica Bank</Text>
        <Text>{amount} {currency}</Text>
      </View>
    </Page>
  </Document>
);

export default BanknotePDF;