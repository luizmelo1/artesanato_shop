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
    const images = dom.hero.backgrounds;
    setInterval(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.remove('active');
        images[nextIndex].classList.add('active');
        currentIndex = nextIndex;
    }, 10000);
}
