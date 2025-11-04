/**
 * Módulo de Hero Slideshow
 * Controla slideshow de imagens de fundo do hero
 */

/**
 * Controla o slideshow do hero (troca de imagens de fundo a cada 10s).
 * Usa crossfade suave entre imagens com transições CSS.
 * @param {object} dom - Referências DOM
 */
export function initHeroSlideshow(dom) {
    if (!dom.hero.backgrounds?.length) return;
    
    let currentIndex = 0;
    const backgrounds = dom.hero.backgrounds;
    
    // Troca de slide a cada 10 segundos com crossfade suave
    setInterval(() => {
        // Calcula próximo índice
        const nextIndex = (currentIndex + 1) % backgrounds.length;
        
        // Remove classe active da imagem atual (fade out)
        backgrounds[currentIndex].classList.remove('active');
        
        // Adiciona classe active na próxima imagem (fade in)
        // O CSS cuida da transição suave entre elas
        backgrounds[nextIndex].classList.add('active');
        
        // Atualiza índice atual
        currentIndex = nextIndex;
    }, 10000);
}
