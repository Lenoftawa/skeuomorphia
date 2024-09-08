// import { jsPDF } from 'jspdf';

// export const printBanknote = async (amount: number, currency: string) => {
//   const doc = new jsPDF();
  
//   doc.setFontSize(22);
//   doc.text('Skeuomorphica Bank', 105, 20, { align: 'center' });
  
//   doc.setFontSize(18);
//   doc.text(`${amount} ${currency}`, 105, 40, { align: 'center' });
  
//   doc.setFontSize(12);
//   doc.text('This note is backed by crypto assets', 105, 60, { align: 'center' });
  
//   // Generate a simple QR code (you might want to use a proper QR code library)
//   doc.rect(80, 70, 50, 50);
//   doc.text('QR Code', 105, 95, { align: 'center' });

//   // Open the PDF in a new window
//   const pdfOutput = doc.output('bloburl');
//   window.open(pdfOutput, '_blank');
// };