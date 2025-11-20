import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../../src/img/produtos');
const outputDir = path.join(__dirname, '../../src/img/hero');

// Imagens selecionadas para o hero (alta resolução)
const heroImages = [
    { input: 'funkopop/original/funkopop_5.jpg', output: 'hero-funkopop-5.webp' },
    { input: 'rosas/original/rosas_2.jpg', output: 'hero-rosas-2.webp' },
    { input: 'funkopop/original/funkopop_6.jpg', output: 'hero-funkopop-6.webp' },
    { input: 'rosas/original/rosas_5.jpg', output: 'hero-rosas-5.webp' },
    { input: 'funkopop/original/funkopop_5.jpg', output: 'hero-funkopop-5-alt.webp' }
];

async function createHeroImages() {
    console.log('Criando imagens do hero em alta resolução...\n');
    
    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const img of heroImages) {
        const inputPath = path.join(baseDir, img.input);
        const outputPath = path.join(outputDir, img.output);
        
        try {
            if (!fs.existsSync(inputPath)) {
                console.log(`⚠ Arquivo não encontrado: ${img.input}`);
                continue;
            }
            
            // Criar imagem em alta resolução (1920x1080) para hero
            await sharp(inputPath)
                .resize(1920, 1080, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 90 }) // Qualidade alta para hero
                .toFile(outputPath);
            
            const inputStats = fs.statSync(inputPath);
            const outputStats = fs.statSync(outputPath);
            
            console.log(`✓ ${img.input} → ${img.output}`);
            console.log(`  Resolução: 1920x1080px`);
            console.log(`  Tamanho original: ${(inputStats.size / 1024).toFixed(2)} KB`);
            console.log(`  Tamanho WebP: ${(outputStats.size / 1024).toFixed(2)} KB`);
            console.log(`  Qualidade: 90%\n`);
        } catch (error) {
            console.error(`✗ Erro ao processar ${img.input}:`, error.message);
        }
    }
    
    console.log('✅ Imagens do hero criadas com sucesso!');
}

createHeroImages();
