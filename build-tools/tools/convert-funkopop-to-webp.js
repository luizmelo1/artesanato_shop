import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../../src/img/produtos/funkopop');
const outputDir = inputDir;

// Lista de arquivos para converter
const files = [
    'funkopop_1.jpg',
    'funkopop_2.jpg',
    'funkopop_3.jpg',
    'funkopop_4.jpg',
    'funkopop_5.jpg',
    'funkopop_6.jpg',
    'funkopop_7.png',
    'funkopop_8.png',
    'funkopop_9.png',
    'funkopop_10.png',
    'funkopop_11.png',
    'funkopop_12.png',
    'funkopop_13.png'
];

async function convertToWebP() {
    console.log('Iniciando conversão de imagens Funko Pop para WebP...\n');
    
    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputFileName = file.replace(/\.(jpg|png)$/i, '.webp');
        const outputPath = path.join(outputDir, outputFileName);
        
        try {
            await sharp(inputPath)
                .webp({ quality: 85 })
                .toFile(outputPath);
            
            const inputStats = fs.statSync(inputPath);
            const outputStats = fs.statSync(outputPath);
            const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);
            
            console.log(`✓ ${file} → ${outputFileName}`);
            console.log(`  Tamanho original: ${(inputStats.size / 1024).toFixed(2)} KB`);
            console.log(`  Tamanho WebP: ${(outputStats.size / 1024).toFixed(2)} KB`);
            console.log(`  Redução: ${reduction}%\n`);
        } catch (error) {
            console.error(`✗ Erro ao converter ${file}:`, error.message);
        }
    }
    
    console.log('Conversão concluída!');
}

convertToWebP();
