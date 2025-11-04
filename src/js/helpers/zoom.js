/**
 * Módulo de Helpers para Zoom de Imagem
 * Gerencia zoom com mouse e touch (pinch-to-zoom)
 */

// Estado do zoom por toque (mobile)
const touchZoomState = {
    initialDistance: 0,
    currentScale: 1,
    lastPosX: 0,
    lastPosY: 0,
    isZooming: false
};

/**
 * Calcula a distância entre dois toques (pinch gesture).
 * @param {Touch} touch1 
 * @param {Touch} touch2 
 * @returns {number} Distância em pixels
 */
export function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula o ponto central entre dois toques.
 * @param {Touch} touch1 
 * @param {Touch} touch2 
 * @returns {{x: number, y: number}}
 */
export function getTouchCenter(touch1, touch2) {
    return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
    };
}

/**
 * Calcula a posição do zoom baseada na posição do mouse.
 * Usa coordenadas relativas à imagem para um zoom mais natural.
 * @param {MouseEvent} e
 * @param {DOMRect} containerRect - BoundingClientRect do container.
 * @param {number} scale - Nível de zoom aplicado
 * @returns {{x: number, y: number}} Coordenadas de transformação em pixels.
 */
export function calculateZoomPosition(e, containerRect, scale) {
    // Posição do mouse relativa ao container
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    // Converte para porcentagem (0-1)
    const relativeX = x / containerRect.width;
    const relativeY = y / containerRect.height;
    
    // Calcula quanto a imagem pode se mover (metade da diferença entre tamanho ampliado e original)
    const maxMoveX = (containerRect.width * (scale - 1)) / 2;
    const maxMoveY = (containerRect.height * (scale - 1)) / 2;
    
    // Calcula o deslocamento baseado na posição do mouse
    // Centralizado (0.5) = sem movimento, nas bordas = movimento máximo
    const translateX = (0.5 - relativeX) * maxMoveX * 2;
    const translateY = (0.5 - relativeY) * maxMoveY * 2;
    
    // Limita o movimento para não ultrapassar as bordas
    const clampedX = Math.max(-maxMoveX, Math.min(maxMoveX, translateX));
    const clampedY = Math.max(-maxMoveY, Math.min(maxMoveY, translateY));
    
    return { x: clampedX, y: clampedY };
}

/**
 * Calcula a posição do zoom para dispositivos móveis (touch).
 * @param {number} centerX - Posição X do centro do gesto
 * @param {number} centerY - Posição Y do centro do gesto
 * @param {DOMRect} containerRect - BoundingClientRect do container
 * @param {number} scale - Nível de zoom aplicado
 * @returns {{x: number, y: number}}
 */
export function calculateTouchZoomPosition(centerX, centerY, containerRect, scale) {
    // Posição do toque relativa ao container
    const x = centerX - containerRect.left;
    const y = centerY - containerRect.top;
    
    // Converte para porcentagem (0-1)
    const relativeX = x / containerRect.width;
    const relativeY = y / containerRect.height;
    
    // Calcula quanto a imagem pode se mover
    const maxMoveX = (containerRect.width * (scale - 1)) / 2;
    const maxMoveY = (containerRect.height * (scale - 1)) / 2;
    
    // Calcula o deslocamento baseado na posição do toque
    const translateX = (0.5 - relativeX) * maxMoveX * 2;
    const translateY = (0.5 - relativeY) * maxMoveY * 2;
    
    // Limita o movimento para não ultrapassar as bordas
    const clampedX = Math.max(-maxMoveX, Math.min(maxMoveX, translateX));
    const clampedY = Math.max(-maxMoveY, Math.min(maxMoveY, translateY));
    
    return { x: clampedX, y: clampedY };
}

/**
 * Aplica transformação de zoom suave na imagem.
 * @param {HTMLImageElement} image
 * @param {number} x - Deslocamento horizontal em pixels
 * @param {number} y - Deslocamento vertical em pixels
 * @param {number} scale - Nível de zoom
 */
export function applyZoomTransform(image, x, y, scale) {
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

/**
 * Remove transformações aplicadas na imagem.
 * @param {HTMLImageElement} image
 */
export function resetTransform(image) {
    image.style.transform = '';
    touchZoomState.initialDistance = 0;
    touchZoomState.currentScale = 1;
    touchZoomState.lastPosX = 0;
    touchZoomState.lastPosY = 0;
    touchZoomState.isZooming = false;
}

/**
 * Retorna o estado atual do zoom por toque
 * @returns {object}
 */
export function getTouchZoomState() {
    return touchZoomState;
}
