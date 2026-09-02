import React, { useState, useEffect } from 'react';
import BarcodeDisplay from '../components/BarcodeDisplay';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { catalogueAPI } from '../api';

const LABELS_PER_ROW = 4;
const LABELS_PER_COL = 10;
const TOTAL_LABELS = LABELS_PER_ROW * LABELS_PER_COL;

export default function BarcodePrintPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [printMode, setPrintMode] = useState<'single'|'all'|null>(null);
  const [selectedBarcode, setSelectedBarcode] = useState<string|null>(null);

  useEffect(() => {
    // Fetch all products with barcodes
    catalogueAPI.getAll().then(res => {
      setProducts(res.data || []);
    });
  }, []);

  // Print a full page of one barcode
  const handlePrintSingle = (barcode: string) => {
    setSelectedBarcode(barcode);
    setPrintMode('single');
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.print();
    }, 400);
  };

  // Print all barcodes (one per product)
  const handlePrintAll = () => {
    setPrintMode('all');
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.print();
    }, 400);
  };

  // Download as PDF (single barcode)
  const handleDownloadSingle = async (barcode: string) => {
    setSelectedBarcode(barcode);
    setPrintMode('single');
    setTimeout(async () => {
      const element = document.getElementById('barcode-print-sheet');
      if (element) {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save('barcodes.pdf');
      }
      setPrintMode(null);
      setSelectedBarcode(null);
    }, 200);
  };

  // Download as PDF (all barcodes)
  const handleDownloadAll = async () => {
    setPrintMode('all');
    setTimeout(async () => {
      const element = document.getElementById('barcode-print-sheet');
      if (element) {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save('all-barcodes.pdf');
      }
      setPrintMode(null);
    }, 200);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Barcode Print & Download</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Barcode</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item: any) => (
            <tr key={item.sku}>
              <td>{item.sku}</td>
              <td>{item.barcode || item.sku}</td>
              <td>
                <button onClick={() => handlePrintSingle(item.barcode || item.sku)} style={{ marginRight: 8 }}>Print Stickers</button>
                <button onClick={() => handleDownloadSingle(item.barcode || item.sku)}>Download Stickers</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePrintAll} style={{ marginRight: 8 }}>Print All Barcodes</button>
      <button onClick={handleDownloadAll}>Download All Barcodes</button>

      {/* Print/Download Section */}
      {(printMode === 'single' && selectedBarcode) && (
        <div id="barcode-print-sheet" style={{
          position: 'fixed', left: 0, top: 0, width: '210mm', height: '297mm',
          display: 'grid', gridTemplateColumns: `repeat(${LABELS_PER_ROW}, 48mm)`, gridTemplateRows: `repeat(${LABELS_PER_COL}, 25mm)`, gap: '2mm', margin: 0, padding: '6mm', background: 'white', zIndex: 99999, justifyContent: 'center', alignContent: 'center'
        }}>
          {Array.from({ length: TOTAL_LABELS }).map((_, i: number) => (
            <div className="barcode-label" key={i} style={{ border: '1px dashed #bbb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '25mm', width: '48mm', margin: 0, padding: 0 }}>
              <BarcodeDisplay barcodeNumber={selectedBarcode} width={1.5} height={32} showText={false} />
              <div style={{ fontSize: '10px', marginTop: 2 }}>{selectedBarcode}</div>
            </div>
          ))}
        </div>
      )}
      {(printMode === 'all') && (
        <div id="barcode-print-sheet" style={{
          position: 'fixed', left: 0, top: 0, width: '210mm', height: '297mm',
          display: 'grid', gridTemplateColumns: `repeat(${LABELS_PER_ROW}, 48mm)`, gridTemplateRows: `repeat(${LABELS_PER_COL}, 25mm)`, gap: '2mm', margin: 0, padding: '6mm', background: 'white', zIndex: 99999, justifyContent: 'center', alignContent: 'center'
        }}>
          {products.slice(0, TOTAL_LABELS).map((item: any, i: number) => (
            <div className="barcode-label" key={item.sku} style={{ border: '1px dashed #bbb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '25mm', width: '48mm', margin: 0, padding: 0 }}>
              <BarcodeDisplay barcodeNumber={item.barcode || item.sku} width={1.5} height={32} showText={false} />
              <div style={{ fontSize: '10px', marginTop: 2 }}>{item.sku} {item.name ? `- ${item.name}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @media print {
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
          }
          #barcode-print-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
            z-index: 99999 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 6mm !important;
            display: grid !important;
            grid-template-columns: repeat(${LABELS_PER_ROW}, 48mm) !important;
            grid-template-rows: repeat(${LABELS_PER_COL}, 25mm) !important;
            gap: 2mm !important;
            justify-content: center !important;
            align-content: center !important;
          }
          #barcode-print-sheet .barcode-label {
            margin: 0 !important;
            padding: 0 !important;
            width: 48mm !important;
            height: 25mm !important;
            border: 1px dashed #bbb !important;
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #barcode-print-sheet * {
            visibility: visible !important;
          }
          body *:not(#barcode-print-sheet):not(#barcode-print-sheet *) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
