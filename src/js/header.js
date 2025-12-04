/**
 * Comportamento do header: aplica a classe "scrolled" quando o usuário rola a página
 * além de um determinado limiar. Usa requestAnimationFrame para evitar custo alto
 * em eventos de scroll (pattern semelhante a throttle).
 * 
 * Também gerencia a abertura/fechamento do menu mobile.
 */
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    const mobileMenu = document.querySelector('.mobile-menu');
    const scrollThreshold = 100;

    /**
     * Atualiza o estado visual do header com base no scrollY atual.
     */
    function updateHeader() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Atualiza o header no carregamento inicial
    updateHeader();

    // Adiciona o evento de scroll com throttle para melhor performance
    let ticking = false;
    globalThis.addEventListener('scroll', () => {
        if (!ticking) {
            globalThis.requestAnimationFrame(() => {
                updateHeader();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Toggle do menu mobile (hambúrguer)
    if (mobileMenu && nav) {
        mobileMenu.addEventListener('click', () => {
            const isExpanded = mobileMenu.getAttribute('aria-expanded') === 'true';
            mobileMenu.setAttribute('aria-expanded', !isExpanded);
            nav.classList.toggle('active');
        });
    }

    // Fecha menu mobile ao clicar em um link
    if (nav) {
        const navLinks = nav.querySelectorAll('a');
        for (const link of navLinks) {
            link.addEventListener('click', () => {
                if (globalThis.innerWidth <= 768) {
                    nav.classList.remove('active');
                    mobileMenu.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // Fecha menu mobile ao mudar orientação do dispositivo
    globalThis.addEventListener('orientationchange', () => {
        if (nav && mobileMenu && nav.classList.contains('active')) {
            nav.classList.remove('active');
            mobileMenu.setAttribute('aria-expanded', 'false');
        }
    });
});