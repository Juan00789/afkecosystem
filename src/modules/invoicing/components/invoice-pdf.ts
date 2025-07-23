// src/modules/invoicing/components/invoice-pdf.ts
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import type { UserProfile } from '@/modules/auth/types';
import type { QuoteFormData } from '../types';

export const generateInvoicePDF = (data: QuoteFormData, userProfile: UserProfile) => {
    const doc = new jsPDF();
    const companyName = userProfile?.companyName || userProfile?.displayName || 'Mi Empresa';
    const userEmail = userProfile?.email || '';
    const userPhone = userProfile?.phoneNumber || '';
    const bankName = userProfile?.bankInfo?.bankName || '';
    const accountNumber = userProfile?.bankInfo?.accountNumber || '';

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${userProfile?.displayName || ''}\n${userEmail}\n${userPhone}`, 14, 30);
    
    doc.setFontSize(18);
    doc.text("FACTURA", 200, 22, { align: 'right' });
    
    // Invoice Info
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PARA:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.clientName}\n${data.clientAddress || ''}`, 14, 56);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`FACTURA #: ${invoiceNumber}`, 200, 44, { align: 'right' });
    doc.text(`FECHA: ${new Date().toLocaleDateString('es-DO')}`, 200, 50, { align: 'right' });
    doc.text(`VENCE: ${dueDate.toLocaleDateString('es-DO')}`, 200, 56, { align: 'right' });

    // Table
    const tableColumn = ["Descripción", "Cantidad", "Precio Unitario", "Total"];
    const tableRows: (string|number)[][] = [];
    data.items.forEach(item => {
        const itemData = [
            item.description,
            item.quantity,
            `$${item.price.toFixed(2)}`,
            `$${(item.quantity * item.price).toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: [33, 150, 243] } // Primary color
    });

    // Totals
    const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const itbis = data.includeITBIS ? subtotal * 0.18 : 0;
    const total = subtotal + itbis;
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text("Subtotal:", 140, finalY + 10);
    doc.text(`$${subtotal.toFixed(2)}`, 200, finalY + 10, { align: 'right' });
    if(data.includeITBIS) {
      doc.text("ITBIS (18%):", 140, finalY + 17);
      doc.text(`$${itbis.toFixed(2)}`, 200, finalY + 17, { align: 'right' });
    }
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 140, finalY + 24);
    doc.text(`$${total.toFixed(2)}`, 200, finalY + 24, { align: 'right' });

    // Notes and Banking Info
    let bottomY = finalY + 40;
    if (data.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Notas:", 14, bottomY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(data.notes, 180), 14, bottomY + 6);
      bottomY += 20;
    }
    
    if (bankName || accountNumber) {
      doc.setFont("helvetica", "bold");
      doc.text("Información de Pago:", 14, bottomY);
      doc.setFont("helvetica", "normal");
      doc.text(`${bankName ? `Banco: ${bankName}` : ''}\n${accountNumber ? `Cuenta: ${accountNumber}` : ''}`, 14, bottomY + 6);
    }
    
    doc.save(`Factura-${invoiceNumber}-${data.clientName.replace(/\s+/g, '-')}.pdf`);
  };
