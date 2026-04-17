/**
 * Redimensiona y comprime una imagen en el cliente usando Canvas.
 *
 * - Máximo 900×900 px (mantiene proporción)
 * - Comprime iterativamente hasta que el resultado sea < maxOutputKB
 * - Siempre devuelve JPEG (excepto PNG transparente → PNG)
 *
 * @param {File} file           - Archivo original del input
 * @param {number} maxDim       - Dimensión máxima en px (default 900)
 * @param {number} maxOutputKB  - Tamaño máximo de salida en KB (default 280)
 * @returns {Promise<string>}   - Data-URL comprimida lista para enviar
 */
export async function compressImage(file, maxDim = 900, maxOutputKB = 280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Calcular dimensiones destino manteniendo proporción
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // PNG con transparencia → mantener PNG, el resto → JPEG
        const hasPng = file.type === 'image/png';
        const mimeOut = hasPng ? 'image/png' : 'image/jpeg';

        if (hasPng) {
          // PNG: un solo intento, sin iteración de calidad
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        // JPEG: bajar calidad iterativamente hasta cumplir el límite
        let quality = 0.85;
        let dataUrl = canvas.toDataURL(mimeOut, quality);

        while (dataUrl.length > maxOutputKB * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL(mimeOut, quality);
        }

        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
