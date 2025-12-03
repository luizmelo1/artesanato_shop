/**
 * Módulo de Validação de Inputs
 * Validação robusta de dados antes de salvar no Firestore
 */

// ============================================
// REGRAS DE VALIDAÇÃO
// ============================================

const VALIDATION_RULES = {
    product: {
        name: {
            required: true,
            minLength: 3,
            maxLength: 100,
            pattern: /^[a-zA-ZÀ-ÿ0-9\s\-_.()]+$/,
            sanitize: true
        },
        price: {
            required: true,
            type: 'number',
            min: 0.01,
            max: 999999.99,
            decimals: 2
        },
        category: {
            required: true,
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/
        },
        description: {
            required: false,
            maxLength: 1000,
            sanitize: true
        },
        link: {
            required: false,
            type: 'url',
            maxLength: 500
        },
        images: {
            required: false,
            type: 'array',
            maxItems: 10,
            itemType: 'url'
        },
        active: {
            required: true,
            type: 'boolean'
        }
    },
    category: {
        name: {
            required: true,
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/,
            sanitize: true
        },
        slug: {
            required: true,
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-z0-9-]+$/
        }
    }
};

// ============================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================

/**
 * Remove caracteres perigosos de strings
 * @param {string} str - String a ser sanitizada
 * @returns {string} String limpa
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Remove tags HTML
    str = str.replaceAll(/<[^>]*>/g, '');
    
    // Remove caracteres de controle (\u0000-\u001F e \u007F)
    str = str.replaceAll(/[\u0000-\u001F\u007F]/g, '');
    
    // Remove scripts
    str = str.replaceAll(/javascript:/gi, '');
    str = str.replaceAll(/on\w+=/gi, '');
    
    // Trim espaços
    str = str.trim();
    
    return str;
}

/**
 * Sanitiza URL
 * @param {string} url - URL a ser sanitizada
 * @returns {string} URL limpa
 */
function sanitizeUrl(url) {
    if (!url) return '';
    
    url = sanitizeString(url);
    
    // Remove protocolos perigosos
    if (/^(javascript|data|vbscript|file):/i.test(url)) {
        return '';
    }
    
    return url;
}

/**
 * Sanitiza número
 * @param {*} value - Valor a ser sanitizado
 * @param {number} decimals - Casas decimais
 * @returns {number} Número limpo
 */
function sanitizeNumber(value, decimals = 2) {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return 0;
    return Number(num.toFixed(decimals));
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida string
 * @param {string} value - Valor a validar
 * @param {object} rules - Regras de validação
 * @returns {object} {valid: boolean, error: string, sanitized: any}
 */
function validateString(value, rules) {
    // Verificar se é obrigatório
    if (rules.required && (!value || value.trim() === '')) {
        return { valid: false, error: 'Campo obrigatório' };
    }
    
    if (!value || value.trim() === '') {
        return { valid: true, sanitized: '' };
    }
    
    // Sanitizar
    let sanitized = rules.sanitize ? sanitizeString(value) : value;
    
    // Validar comprimento mínimo
    if (rules.minLength && sanitized.length < rules.minLength) {
        return { 
            valid: false, 
            error: `Mínimo de ${rules.minLength} caracteres` 
        };
    }
    
    // Validar comprimento máximo
    if (rules.maxLength && sanitized.length > rules.maxLength) {
        return { 
            valid: false, 
            error: `Máximo de ${rules.maxLength} caracteres` 
        };
    }
    
    // Validar pattern
    if (rules.pattern && !rules.pattern.test(sanitized)) {
        return { 
            valid: false, 
            error: 'Formato inválido' 
        };
    }
    
    return { valid: true, sanitized };
}

/**
 * Valida número
 * @param {*} value - Valor a validar
 * @param {object} rules - Regras de validação
 * @returns {object} {valid: boolean, error: string, sanitized: any}
 */
function validateNumber(value, rules) {
    const num = Number.parseFloat(value);
    
    if (rules.required && (Number.isNaN(num) || value === '' || value === null)) {
        return { valid: false, error: 'Número obrigatório' };
    }
    
    if (Number.isNaN(num)) {
        return { valid: false, error: 'Valor inválido' };
    }
    
    // Validar mínimo
    if (rules.min !== undefined && num < rules.min) {
        return { 
            valid: false, 
            error: `Valor mínimo: ${rules.min}` 
        };
    }
    
    // Validar máximo
    if (rules.max !== undefined && num > rules.max) {
        return { 
            valid: false, 
            error: `Valor máximo: ${rules.max}` 
        };
    }
    
    // Sanitizar decimais
    const sanitized = sanitizeNumber(num, rules.decimals || 2);
    
    return { valid: true, sanitized };
}

/**
 * Valida URL
 * @param {string} value - URL a validar
 * @param {object} rules - Regras de validação
 * @returns {object} {valid: boolean, error: string, sanitized: any}
 */
function validateUrl(value, rules) {
    if (rules.required && (!value || value.trim() === '')) {
        return { valid: false, error: 'URL obrigatória' };
    }
    
    if (!value || value.trim() === '') {
        return { valid: true, sanitized: '' };
    }
    
    // Sanitizar
    const sanitized = sanitizeUrl(value);
    
    if (!sanitized) {
        return { valid: false, error: 'URL inválida ou insegura' };
    }
    
    // Validar formato de URL
    try {
        new URL(sanitized);
    } catch (error) {
        console.debug('URL inválida:', sanitized, error.message);
        return { valid: false, error: 'Formato de URL inválido' };
    }
    
    // Validar comprimento
    if (rules.maxLength && sanitized.length > rules.maxLength) {
        return { 
            valid: false, 
            error: `URL muito longa (máx ${rules.maxLength} caracteres)` 
        };
    }
    
    return { valid: true, sanitized };
}

/**
 * Valida boolean
 * @param {*} value - Valor a validar
 * @param {object} rules - Regras de validação
 * @returns {object} {valid: boolean, error: string, sanitized: any}
 */
function validateBoolean(value, rules) {
    if (rules.required && value === undefined) {
        return { valid: false, error: 'Campo obrigatório' };
    }
    
    const sanitized = Boolean(value);
    return { valid: true, sanitized };
}

/**
 * Valida array
 * @param {*} value - Valor a validar
 * @param {object} rules - Regras de validação
 * @returns {object} {valid: boolean, error: string, sanitized: any}
 */
function validateArray(value, rules) {
    if (rules.required && (!Array.isArray(value) || value.length === 0)) {
        return { valid: false, error: 'Array obrigatório' };
    }
    
    if (!Array.isArray(value)) {
        return { valid: false, error: 'Valor deve ser um array' };
    }
    
    // Validar tamanho máximo
    if (rules.maxItems && value.length > rules.maxItems) {
        return { 
            valid: false, 
            error: `Máximo de ${rules.maxItems} itens` 
        };
    }
    
    // Validar tipo dos itens
    if (rules.itemType === 'url') {
        for (const item of value) {
            const result = validateUrl(item, { required: false });
            if (result.valid === false) {
                return { valid: false, error: `URL inválida no array: ${item}` };
            }
        }
    }
    
    return { valid: true, sanitized: value };
}

/**
 * Valida um campo específico
 * @param {*} value - Valor a validar
 * @param {object} rules - Regras de validação
 * @returns {object} {valid: boolean, error: string, sanitized: any}
 */
function validateField(value, rules) {
    switch (rules.type) {
        case 'number':
            return validateNumber(value, rules);
        case 'url':
            return validateUrl(value, rules);
        case 'boolean':
            return validateBoolean(value, rules);
        case 'array':
            return validateArray(value, rules);
        default:
            return validateString(value, rules);
    }
}

// ============================================
// VALIDAÇÃO DE OBJETOS COMPLETOS
// ============================================

/**
 * Valida objeto completo baseado em regras
 * @param {object} data - Dados a validar
 * @param {string} type - Tipo de validação (product, category)
 * @returns {object} {valid: boolean, errors: object, sanitized: object}
 */
function validateObject(data, type) {
    const rules = VALIDATION_RULES[type];
    
    if (!rules) {
        return { 
            valid: false, 
            errors: { general: 'Tipo de validação inválido' },
            sanitized: {}
        };
    }
    
    const errors = {};
    const sanitized = {};
    let isValid = true;
    
    // Validar cada campo
    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];
        const result = validateField(value, fieldRules);
        
        if (result.valid) {
            sanitized[field] = result.sanitized;
        } else {
            errors[field] = result.error;
            isValid = false;
        }
    }
    
    return { valid: isValid, errors, sanitized };
}

/**
 * Valida dados de produto
 * @param {object} productData - Dados do produto
 * @returns {object} {valid: boolean, errors: object, sanitized: object}
 */
function validateProduct(productData) {
    return validateObject(productData, 'product');
}

/**
 * Valida dados de categoria
 * @param {object} categoryData - Dados da categoria
 * @returns {object} {valid: boolean, errors: object, sanitized: object}
 */
function validateCategory(categoryData) {
    return validateObject(categoryData, 'category');
}

// ============================================
// VALIDAÇÃO DE ARQUIVOS
// ============================================

/**
 * Valida arquivo de imagem
 * @param {File} file - Arquivo a validar
 * @param {object} options - Opções de validação
 * @returns {object} {valid: boolean, error: string}
 */
function validateImageFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    } = options;
    
    // Validar existência
    if (!file) {
        return { valid: false, error: 'Nenhum arquivo selecionado' };
    }
    
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: `Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}` 
        };
    }
    
    // Validar tamanho
    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
        return { 
            valid: false, 
            error: `Arquivo muito grande. Máximo: ${maxMB}MB` 
        };
    }
    
    // Validar nome do arquivo
    const safeName = sanitizeString(file.name);
    if (safeName !== file.name) {
        return { 
            valid: false, 
            error: 'Nome de arquivo contém caracteres inválidos' 
        };
    }
    
    return { valid: true };
}

/**
 * Valida múltiplos arquivos de imagem
 * @param {FileList|Array} files - Arquivos a validar
 * @param {object} options - Opções de validação
 * @returns {object} {valid: boolean, errors: Array, validFiles: Array}
 */
function validateImageFiles(files, options = {}) {
    const { maxFiles = 10 } = options;
    const errors = [];
    const validFiles = [];
    
    if (!files || files.length === 0) {
        return { valid: false, errors: ['Nenhum arquivo selecionado'], validFiles: [] };
    }
    
    if (files.length > maxFiles) {
        return { 
            valid: false, 
            errors: [`Máximo de ${maxFiles} arquivos permitido`], 
            validFiles: [] 
        };
    }
    
    for (let i = 0; i < files.length; i++) {
        const result = validateImageFile(files[i], options);
        if (result.valid) {
            validFiles.push(files[i]);
        } else {
            errors.push(`Arquivo ${i + 1}: ${result.error}`);
        }
    }
    
    return { 
        valid: validFiles.length > 0, 
        errors, 
        validFiles 
    };
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Mostra erro de validação no campo
 * @param {string} fieldId - ID do campo
 * @param {string} errorMessage - Mensagem de erro
 */
function showFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove erro anterior
    clearFieldError(fieldId);
    
    // Adiciona classe de erro
    field.classList.add('input-error');
    
    // Cria elemento de erro
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-message';
    errorDiv.id = `${fieldId}-error`;
    errorDiv.textContent = errorMessage;
    errorDiv.setAttribute('role', 'alert');
    
    // Insere após o campo
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

/**
 * Remove erro de validação do campo
 * @param {string} fieldId - ID do campo
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('input-error');
    
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Remove todos os erros de validação
 */
function clearAllErrors() {
    const errorFields = document.querySelectorAll('.input-error');
    for (const field of errorFields) {
        field.classList.remove('input-error');
    }
    
    const errorMessages = document.querySelectorAll('.field-error-message');
    for (const msg of errorMessages) {
        msg.remove();
    }
}

/**
 * Mostra erros de validação em múltiplos campos
 * @param {object} errors - Objeto com erros {fieldId: errorMessage}
 */
function showValidationErrors(errors) {
    clearAllErrors();
    
    for (const [field, error] of Object.entries(errors)) {
        showFieldError(field, error);
    }
}

// ============================================
// EXPORTS
// ============================================

// Expor funções globalmente para uso no products.js
globalThis.ValidationModule = {
    validateProduct,
    validateCategory,
    validateImageFile,
    validateImageFiles,
    sanitizeString,
    sanitizeUrl,
    sanitizeNumber,
    showFieldError,
    clearFieldError,
    clearAllErrors,
    showValidationErrors
};
