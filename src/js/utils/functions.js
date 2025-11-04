/**
 * Módulo de Funções Utilitárias
 * Debounce, throttle e lazy loading
 */

/**
 * Debounce: atrasa a execução de uma função até que pare de ser chamada por "wait" ms.
 * Útil para buscas ao digitar ou resize.
 * @template {Function} F
 * @param {F} func - Função a ser executada com debounce.
 * @param {number} wait - Tempo de espera em ms.
 * @returns {F} Uma nova função com comportamento de debounce.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle: limita a frequência de execução de uma função para no máximo 1 vez a cada "limit" ms.
 * Útil para scroll e eventos de alta frequência.
 * @template {Function} F
 * @param {F} func - Função a ser "throttled".
 * @param {number} limit - Janela de tempo em ms.
 * @returns {F} Uma nova função com comportamento de throttle.
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Lazy loading de imagem: atribui o src da imagem quando entra na viewport.
 * Requer que o elemento possua data-src.
 * @param {HTMLImageElement} img - Elemento de imagem a ser observado.
 */
export function lazyLoadImage(img) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });
    observer.observe(img);
}
