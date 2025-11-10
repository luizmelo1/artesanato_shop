/**
 * Helper para criar elementos de imagem com fallback WebP
 * Suporta navegadores que não tem suporte a WebP
 */

/**
 * Converte um caminho de imagem WebP para seu formato original
 * @param {string} webpPath - Caminho da imagem WebP
 * @returns {string} - Caminho da imagem original (jpg/png)
 */
export function getOriginalImagePath(webpPath) {
    // Se não for webp, retorna o caminho original
    if (!webpPath.endsWith('.webp')) {
        return webpPath;
    }
    
    // Procura por indicadores de formato original no caminho
    // Prioriza PNG para imagens numeradas acima de 6 (funkopop_7+)
    const filename = webpPath.split('/').pop();
    const regex = /funkopop_(\d+)/;
    const match = regex.exec(filename);
    
    if (match) {
        const number = Number.parseInt(match[1], 10);
        // funkopop_1 a funkopop_6 são JPG, funkopop_7+ são PNG
        const ext = number >= 7 ? 'png' : 'jpg';
        return webpPath.replace('.webp', `.${ext}`);
    }
    
    // Para outros casos, tenta JPG primeiro (mais comum)
    return webpPath.replace('.webp', '.jpg');
}

/**
 * Cria um elemento <picture> com fallback WebP
 * @param {string} src - Caminho da imagem (preferencialmente WebP)
 * @param {string} alt - Texto alternativo
 * @param {object} options - Opções adicionais (loading, width, height, className)
 * @returns {HTMLPictureElement}
 */
export function createPictureWithFallback(src, alt, options = {}) {
    const {
        loading = 'lazy',
        width,
        height,
        className = '',
        draggable = true
    } = options;
    
    const picture = document.createElement('picture');
    if (className) {
        picture.className = className;
    }
    
    // Se a imagem já for WebP, adiciona o source type="image/webp"
    if (src.endsWith('.webp')) {
        const source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = src;
        picture.appendChild(source);
    }
    
    // Cria o elemento img com fallback
    const img = document.createElement('img');
    img.alt = alt;
    img.loading = loading;
    img.draggable = draggable;
    
    // Define o src como a imagem original (fallback)
    img.src = src.endsWith('.webp') ? getOriginalImagePath(src) : src;
    
    if (width) img.width = width;
    if (height) img.height = height;
    
    picture.appendChild(img);
    
    return picture;
}

/**
 * Atualiza um elemento picture existente com nova imagem
 * @param {HTMLPictureElement} picture - Elemento picture a ser atualizado
 * @param {string} src - Novo caminho da imagem
 * @param {string} alt - Novo texto alternativo
 */
export function updatePictureSource(picture, src, alt) {
    if (!picture?.tagName || picture.tagName !== 'PICTURE') {
        console.error('updatePictureSource: elemento não é um <picture>');
        return;
    }
    
    const source = picture.querySelector('source[type="image/webp"]');
    const img = picture.querySelector('img');
    
    if (!img) {
        console.error('updatePictureSource: <img> não encontrado dentro do <picture>');
        return;
    }
    
    // Atualiza ou cria o source WebP
    if (src.endsWith('.webp')) {
        if (source) {
            source.srcset = src;
        } else {
            const newSource = document.createElement('source');
            newSource.type = 'image/webp';
            newSource.srcset = src;
            img.before(newSource);
        }
        
        // Atualiza o fallback
        img.src = getOriginalImagePath(src);
    } else {
        // Remove source WebP se existir
        if (source) {
            source.remove();
        }
        img.src = src;
    }
    
    img.alt = alt;
}
