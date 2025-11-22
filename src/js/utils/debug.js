/**
 * Sistema de debug centralizado
 * Permite ativar/desativar logs sem alterar código em produção
 */

// Flag de debug - altere para true durante desenvolvimento
const DEBUG_MODE = true;

/**
 * Log condicional (apenas se DEBUG_MODE = true)
 * @param  {...any} args - Argumentos para console.log
 */
export function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

/**
 * Sempre loga avisos (importante em produção)
 * @param  {...any} args - Argumentos para console.warn
 */
export function debugWarn(...args) {
    console.warn(...args);
}

/**
 * Sempre loga erros (crítico em produção)
 * @param  {...any} args - Argumentos para console.error
 */
export function debugError(...args) {
    console.error(...args);
}
