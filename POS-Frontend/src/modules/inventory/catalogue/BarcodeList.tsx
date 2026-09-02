import React, { useEffect, useState, useRef } from 'react';
import { downloadFile } from '../../../utils/downloadFile';
import { getCatalogues } from './catalogueApi';
import { Catalogue } from './types';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

const BarcodeList: React.FC = () => {
  const [catalogue, setCatalogue] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const fetchCatalogue = async () => {
    try {
      const res = await getCatalogues();
      setCatalogue(res.data.filter((item: Catalogue) => item.status === 'active'));
    } catch (err) {
      setCatalogue([]);
    } finally {
      setLoading(false);
    }
  };

  // Print sticker sheet layout
  const [printBarcode, setPrintBarcode] = useState<string|null>(null);
  const [showPrintGrid, setShowPrintGrid] = useState(false);
  // For barcode canvases
  const barcodeCanvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
  // Generate barcodes in canvases when modal is shown
  useEffect(() => {
    if (showPrintGrid && printBarcode) {
      import('jsbarcode').then(({ default: JsBarcode }) => {
        barcodeCanvasesRef.current.forEach((canvas) => {
          if (canvas) {
            JsBarcode(canvas, printBarcode, {
              format: 'CODE128',
              width: 2,
              height: 32,
              displayValue: false,
              margin: 0,
            });
          }
        });
      });
    }
  }, [showPrintGrid, printBarcode]);
  const LABELS_PER_ROW = 4;
  const LABELS_PER_COL = 10;
  const TOTAL_LABELS = LABELS_PER_ROW * LABELS_PER_COL;

  // View sticker sheet layout
  const handleView = (barcode: string) => {
    setPrintBarcode(barcode);
    setShowPrintGrid(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>Barcodes</h1>
            <div style={{ color: '#6c6c6c', fontSize: 16 }}>Download and print product barcodes</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => handleDownloadAllBarcodes()}
              style={{
                padding: '10px 28px',
                background: '#3182ce',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 17,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #e6e6e6',
              }}
            >
              Download All Barcodes
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', padding: 0 }}>
          <div style={{ width: '100%', maxHeight: 520, overflowY: 'auto', borderRadius: 12 }}>
            {loading ? (
              <div style={{ padding: 32 }}>Loading...</div>
            ) : catalogue.length === 0 ? (
              <div style={{ padding: 32 }}>No catalogue items available.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 13, letterSpacing: 0.2, position: 'sticky', top: 0 }}>
                    <th style={{ padding: 14, textAlign: 'left', borderTopLeftRadius: 8, width: 200 }}>Item Name</th>
                    <th style={{ padding: 14, textAlign: 'left', width: 120 }}>SKU</th>
                    <th style={{ padding: 14, textAlign: 'left', width: 200 }}>Barcode</th>
                    <th style={{ padding: 14, textAlign: 'center', borderTopRightRadius: 8, width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogue.map((item, idx) => (
                    <tr key={item.sku} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 14, background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: 14, color: '#111827', fontWeight: 500 }}>{item.itemName}</td>
                      <td style={{ padding: 14, color: '#111827', fontWeight: 500 }}>{item.sku}</td>
                      <td style={{ padding: 14 }}>{item.barcode || <span style={{ color: '#aaa' }}>N/A</span>}</td>
                      <td style={{ padding: 14, textAlign: 'center' }}>
                        {item.barcode ? (
                          <button
                            onClick={() => handleView(item.barcode!)}
                            style={{ padding: '6px 18px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, marginRight: 8 }}
                          >View</button>
                        ) : (
                          <span style={{ color: '#aaa', fontSize: 13 }}>No Barcode</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    {/* Print sticker grid overlay */}
    {showPrintGrid && printBarcode && (
      <>
        {/* Modal overlay */}
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 99998 }} onClick={() => setShowPrintGrid(false)} />
        <div
          id="barcode-print-sheet-modal"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(99vw, 1200px)',
            height: 'min(96vh, 850px)',
            maxWidth: '210mm',
            maxHeight: '297mm',
            overflow: 'auto',
            background: 'white',
            zIndex: 99999,
            boxShadow: '0 8px 32px #0002',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {/* Close button */}
          <button onClick={() => setShowPrintGrid(false)} style={{ position: 'sticky', top: 0, right: 0, alignSelf: 'flex-end', zIndex: 100000, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>Close</button>
          <div
            id="barcode-print-sheet"
            style={{
              width: '100%',
              minWidth: 0,
              flex: 1,
              display: 'grid',
              gridTemplateColumns: `repeat(${LABELS_PER_ROW}, 1fr)`,
              gridAutoRows: 'minmax(48px, 1fr)',
              gap: '8px',
              overflow: 'auto',
            }}
          >
            {Array.from({ length: TOTAL_LABELS }).map((_, i: number) => (
              <div className="barcode-label" key={i} style={{ border: '1px dashed #bbb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 80, margin: 0, padding: 0 }}>
                <canvas
                  ref={el => { barcodeCanvasesRef.current[i] = el; }}
                  width={120}
                  height={32}
                  style={{ width: '90%', height: '32px', objectFit: 'contain', background: 'white' }}
                />
                <div style={{ fontSize: '10px', marginTop: 2 }}>{printBarcode}</div>
              </div>
            ))}
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'center' }}>
            <button
              onClick={async () => {
                // Download as PDF
                const jsPDF = (await import('jspdf')).default;
                const html2canvas = (await import('html2canvas')).default;
                const grid = document.getElementById('barcode-print-sheet');
                if (!grid) return;
                const canvas = await html2canvas(grid, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
                pdf.save('barcodes.pdf');
              }}
              style={{ padding: '10px 28px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 17, cursor: 'pointer' }}
            >Download PDF</button>
          </div>
        </div>
      </>
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

  // Handler for downloading all barcodes as a PDF
  async function handleDownloadAllBarcodes() {
    if (!catalogue.length) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;
    const barcodeHeight = 60;
    const barcodeWidth = 240;
    const rowHeight = 110;
    const itemsPerPage = Math.floor((doc.internal.pageSize.getHeight() - margin * 2) / rowHeight);

    for (let i = 0; i < catalogue.length; i++) {
      const item = catalogue[i];
      if (!item.barcode) continue;
      // Generate barcode image locally using JsBarcode
      const canvas = document.createElement('canvas');
      canvas.width = barcodeWidth;
      canvas.height = barcodeHeight;
      JsBarcode(canvas, item.barcode, {
        format: 'CODE128',
        width: 2,
        height: barcodeHeight,
        displayValue: false,
        margin: 0,
      });
      const imgData = canvas.toDataURL('image/png');
      // Draw item name
      doc.setFontSize(13);
      doc.text(item.itemName || '', margin, y + 16);
      // Draw barcode image
      doc.addImage(imgData, 'PNG', margin, y + 24, barcodeWidth, barcodeHeight);
      // Draw barcode number
      doc.setFontSize(12);
      doc.text(item.barcode, margin, y + 24 + barcodeHeight + 18);

      y += rowHeight;
      // Add new page if needed
      if ((i + 1) % itemsPerPage === 0 && i !== catalogue.length - 1) {
        doc.addPage();
        y = margin;
      }
    }
    doc.save('all_barcodes.pdf');
  }
};

export default BarcodeList;
