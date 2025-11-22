// Sistema de Autenticação - Otimizado para Mobile

// Variável global para prevenir múltiplas submissões
let isAuthenticating = false;

// Função principal de login
async function doLogin(email, password) {
    if (isAuthenticating) {
        return;
    }
    
    isAuthenticating = true;
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');
    
    try {
        // Atualiza UI
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Entrando...</span>';
        errorMessage.classList.add('hidden');
        
        // Faz login
        await firebase.auth().signInWithEmailAndPassword(email, password);
        
        // Força o redirecionamento imediato
        try {
            globalThis.location.href = '/admin/dashboard.html';
        } catch (redirectError) {
            console.error('Erro ao redirecionar:', redirectError);
            // Fallback: recarrega a página atual que deve redirecionar pelo onAuthStateChanged
            globalThis.location.reload();
        }
        
    } catch (error) {
        console.error('✗ Erro no login:', error.code, error.message);
        isAuthenticating = false;
        
        let mensagem = 'Erro ao fazer login. Tente novamente.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                mensagem = 'E-mail inválido.';
                break;
            case 'auth/user-disabled':
                mensagem = 'Usuário desabilitado.';
                break;
            case 'auth/user-not-found':
                mensagem = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                mensagem = 'Senha incorreta.';
                break;
            case 'auth/too-many-requests':
                mensagem = 'Muitas tentativas. Aguarde alguns minutos.';
                break;
            case 'auth/network-request-failed':
                mensagem = 'Erro de conexão. Verifique sua internet.';
                break;
        }
        
        errorMessage.textContent = mensagem;
        errorMessage.classList.remove('hidden');
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Entrar</span><span class="btn-arrow">→</span>';
    }
}

// Inicializar quando DOM estiver pronto
function initAuth() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    
    if (!loginForm || !emailInput || !passwordInput) {
        console.error('Elementos do formulário não encontrados!');
        return;
    }
    
    // Verifica se Firebase está carregado
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase não está carregado!');
        if (errorMessage) {
            errorMessage.textContent = 'Erro ao carregar Firebase. Recarregue a página.';
            errorMessage.classList.remove('hidden');
        }
        return;
    }

    // Handler do formulário
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            if (errorMessage) {
                errorMessage.textContent = 'Preencha todos os campos.';
                errorMessage.classList.remove('hidden');
            }
            return;
        }
        
        doLogin(email, password);
    });
    
    // Verifica se já está logado (apenas uma vez)
    let authCheckDone = false;
    firebase.auth().onAuthStateChanged((user) => {
        if (authCheckDone) return; // Previne múltiplas execuções
        
        if (user) {
            authCheckDone = true;
            
            // Redireciona imediatamente
            globalThis.location.replace('/admin/dashboard.html');
        }
    });
}

// Aguarda DOM e Firebase
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
