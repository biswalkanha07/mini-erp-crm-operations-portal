import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  barcodeNumber: string;
  width?: number;
  height?: number;
  showText?: boolean;
  format?: 'CODE128' | 'EAN13' | 'EAN8';
  className?: string;
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  barcodeNumber,
  width = 2,
  height = 100,
  showText = true,
  format = 'CODE128',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && barcodeNumber) {
      try {
        JsBarcode(canvasRef.current, barcodeNumber, {
          format: format,
          width: width,
          height: height,
          displayValue: showText,
          fontSize: 12,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [barcodeNumber, width, height, showText, format]);

  if (!barcodeNumber) {
    return (
      <div className={className} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: height + 20,
        color: '#999',
        fontSize: '12px'
      }}>
        No barcode
      </div>
    );
  }

  return (
    <div className={className} style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} />
      {showText && (
        <div style={{ 
          marginTop: '5px', 
          fontSize: '10px', 
          color: '#666',
          wordBreak: 'break-all'
        }}>
          {barcodeNumber}
        </div>
      )}
    </div>
  );
};

export default BarcodeDisplay;

