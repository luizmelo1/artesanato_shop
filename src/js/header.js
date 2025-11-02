/**
 * Comportamento do header: aplica a classe "scrolled" quando o usuário rola a página
 * além de um determinado limiar. Usa requestAnimationFrame para evitar custo alto
 * em eventos de scroll (pattern semelhante a throttle).
 */
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
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
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateHeader();
                ticking = false;
            });
            ticking = true;
        }
    });
});