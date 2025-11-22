// Verificação de autenticação (usar em todas as páginas admin exceto login)

// Aguarda Firebase estar pronto
function initAuthCheck() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase não está disponível!');
        setTimeout(initAuthCheck, 100);
        return;
    }
    
    const auth = firebase.auth();
    
    // Verifica estado de autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Está logado, mostra email
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        } else {
            // Não está logado, redireciona para login
            globalThis.location.href = '/admin/index.html';
        }
    });
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                globalThis.location.href = '/admin/index.html';
            } catch (error) {
                console.error('Erro ao sair:', error);
                alert('Erro ao sair. Tente novamente.');
            }
        });
    }
}

// Inicia verificação quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthCheck);
} else {
    initAuthCheck();
}
