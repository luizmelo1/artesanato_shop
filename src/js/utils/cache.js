/**
 * Módulo de Cache do LocalStorage
 * Gerencia cache de produtos com versionamento e expiração
 */

import { debugLog, debugWarn } from './debug.js';

export const cache = {
    CACHE_KEY: 'artesanato_products',
    CACHE_VERSION: '1.2', // Incrementar quando houver mudanças nos produtos
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 horas em milissegundos

    /**
     * Salvar produtos no cache.
     * @param {Array<object>} data - Lista de produtos a serem armazenados.
     * @returns {boolean} true em caso de sucesso, false caso contrário.
     */
    set(data) {
        try {
            const cacheData = {
                data: data,
                version: this.CACHE_VERSION,
                timestamp: Date.now()
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
            debugLog('Produtos salvos no cache');
            return true;
        } catch (error) {
            debugWarn('Erro ao salvar cache:', error);
            return false;
        }
    },

    /**
     * Recuperar produtos do cache.
     * Aplica validações de versão e expiração.
     * @returns {Array<object>|null} Lista de produtos ou null se inválido/expirado.
     */
    get() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) {
                debugLog('Cache vazio');
                return null;
            }

            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
            // Verificar se a versão do cache está atualizada
            if (cacheData.version !== this.CACHE_VERSION) {
                debugLog('Versão do cache desatualizada');
                this.clear();
                return null;
            }

            // Verificar se o cache expirou
            if (now - cacheData.timestamp > this.CACHE_DURATION) {
                debugLog('Cache expirado');
                this.clear();
                return null;
            }

            debugLog('Produtos carregados do cache');
            return cacheData.data;
        } catch (error) {
            debugWarn('Erro ao ler cache:', error);
            this.clear();
            return null;
        }
    },

    /**
     * Limpar cache do localStorage por chave.
     */
    clear() {
        localStorage.removeItem(this.CACHE_KEY);
        debugLog('Cache limpo');
    },

    /**
     * Verificar se o cache está válido (existe, versão e prazo válidos).
     * @returns {boolean}
     */
    isValid() {
        return this.get() !== null;
    }
};
