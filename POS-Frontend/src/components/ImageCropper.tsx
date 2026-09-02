import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circularCrop?: boolean;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  circularCrop = false,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, [aspectRatio]);

  const getCroppedImg = (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop
  ): Promise<Blob | null> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    if (circularCrop) {
      // Create circular crop
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        2 * Math.PI
      );
      ctx.clip();
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (circularCrop) {
      ctx.restore();
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        canvasRef.current,
        completedCrop
      );

      if (croppedImageBlob) {
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        onCropComplete(croppedImageUrl);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="image-cropper-modal">
      <div className="image-cropper-content">
        <div className="image-cropper-header">
          <h3>Crop Image</h3>
          <button
            type="button"
            onClick={onCancel}
            className="close-button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        <div className="image-cropper-body">
          <div className="crop-container">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={circularCrop}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '70vh',
                  maxWidth: '90vw',
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          <div className="crop-controls">
            <div className="control-group">
              <label htmlFor="scale">Scale:</label>
              <input
                id="scale"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />
              <span>{Math.round(scale * 100)}%</span>
            </div>

            <div className="control-group">
              <label htmlFor="rotate">Rotate:</label>
              <input
                id="rotate"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotate}
                onChange={(e) => setRotate(Number(e.target.value))}
              />
              <span>{rotate}°</span>
            </div>
          </div>
        </div>

        <div className="image-cropper-footer">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropComplete}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Crop Image
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: 'none',
        }}
      />

      <style>{`
        .image-cropper-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .image-cropper-content {
          background: white;
          border-radius: 8px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .image-cropper-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }

        .image-cropper-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .image-cropper-body {
          padding: 20px;
          flex: 1;
          overflow: auto;
        }

        .crop-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .crop-controls {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-group label {
          font-weight: 500;
          min-width: 50px;
        }

        .control-group input[type="range"] {
          width: 100px;
        }

        .control-group span {
          min-width: 40px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }

        .image-cropper-footer {
          padding: 16px 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .btn:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
};

export default ImageCropper;
