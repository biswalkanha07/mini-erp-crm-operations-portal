// Utility to download a file from a blob or data URL
export function downloadFile(filename: string, url: string | Blob) {
  const link = document.createElement('a');
  link.href = typeof url === 'string' ? url : URL.createObjectURL(url);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    if (typeof url !== 'string') URL.revokeObjectURL(link.href);
  }, 100);
}
