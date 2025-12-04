/**
 * Módulo de Otimização de Imagens
 * Comprime e redimensiona imagens antes do upload
 */

export const ImageOptimizer = {
  // Configurações padrão
  config: {
    maxWidth: 1200,           // Largura máxima
    maxHeight: 1200,          // Altura máxima
    quality: 0.85,            // Qualidade JPEG (0-1)
    thumbnailSize: 400,       // Tamanho das thumbnails
    thumbnailQuality: 0.8,    // Qualidade das thumbnails
    maxFileSize: 5 * 1024 * 1024  // 5MB
  },

  /**
   * Otimiza uma imagem
   * @param {File} file - Arquivo de imagem original
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} - {optimized: Blob, thumbnail: Blob, info: Object}
   */
  async optimizeImage(file, options = {}) {
    const opts = { ...this.config, ...options };

    // Validar arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo não é uma imagem');
    }

    if (file.size > opts.maxFileSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${opts.maxFileSize / 1024 / 1024}MB`);
    }

    // Carregar imagem
    const img = await this.loadImage(file);
    
    // Calcular dimensões otimizadas
    const dimensions = this.calculateDimensions(img.width, img.height, opts.maxWidth, opts.maxHeight);
    
    // Criar imagem otimizada
    const optimized = await this.resizeImage(img, dimensions.width, dimensions.height, opts.quality);
    
    // Criar thumbnail
    const thumbDimensions = this.calculateDimensions(img.width, img.height, opts.thumbnailSize, opts.thumbnailSize);
    const thumbnail = await this.resizeImage(img, thumbDimensions.width, thumbDimensions.height, opts.thumbnailQuality);

    return {
      optimized,
      thumbnail,
      info: {
        originalSize: file.size,
        optimizedSize: optimized.size,
        thumbnailSize: thumbnail.size,
        compression: ((1 - optimized.size / file.size) * 100).toFixed(1),
        originalDimensions: { width: img.width, height: img.height },
        optimizedDimensions: dimensions,
        thumbnailDimensions: thumbDimensions
      }
    };
  },

  /**
   * Carrega uma imagem a partir de um File
   * @param {File} file
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = url;
    });
  },

  /**
   * Calcula dimensões mantendo aspect ratio
   * @param {number} width - Largura original
   * @param {number} height - Altura original
   * @param {number} maxWidth - Largura máxima
   * @param {number} maxHeight - Altura máxima
   * @returns {Object} - {width, height}
   */
  calculateDimensions(width, height, maxWidth, maxHeight) {
    let newWidth = width;
    let newHeight = height;

    // Se a imagem é menor que o máximo, mantém o tamanho original
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calcular aspect ratio
    const aspectRatio = width / height;

    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  },

  /**
   * Redimensiona e comprime uma imagem
   * @param {HTMLImageElement} img
   * @param {number} width
   * @param {number} height
   * @param {number} quality
   * @returns {Promise<Blob>}
   */
  async resizeImage(img, width, height, quality) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      
      // Usar image smoothing para melhor qualidade
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao converter imagem'));
          }
        },
        'image/jpeg',
        quality
      );
    });
  },

  /**
   * Otimiza múltiplas imagens
   * @param {FileList|Array} files
   * @param {Function} progressCallback - Callback para progresso (atual, total)
   * @returns {Promise<Array>}
   */
  async optimizeMultiple(files, progressCallback = null) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        const result = await this.optimizeImage(files[i]);
        results.push({
          success: true,
          original: files[i],
          ...result
        });

        if (progressCallback) {
          progressCallback(i + 1, total);
        }
      } catch (error) {
        results.push({
          success: false,
          original: files[i],
          error: error.message
        });
      }
    }

    return results;
  },

  /**
   * Formata tamanho de arquivo
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
};
