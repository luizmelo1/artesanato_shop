import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../../src/img/produtos/rosas');
const inputDir = path.join(baseDir, 'original');
const outputDir = path.join(baseDir, 'webp');

// Lista de arquivos para converter
const files = [
    'rosas_1.jpg',
    'rosas_2.jpg',
    'rosas_3.jpg',
    'rosas_4.jpg',
    'rosas_5.jpg',
    'rosas_6.jpg'
];

async function convertToWebP() {
    console.log('Iniciando conversão de imagens de Rosas para WebP...\n');
    
    // Criar diretórios se não existirem
    if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir, { recursive: true });
    }
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const file of files) {
        // Primeiro tenta na pasta base (para primeira execução)
        const basePath = path.join(baseDir, file);
        let inputPath = basePath;
        
        // Se já está na pasta original, usa esse caminho
        const originalPath = path.join(inputDir, file);
        if (fs.existsSync(originalPath)) {
            inputPath = originalPath;
        }
        
        const outputFileName = file.replace(/\.(jpg|png)$/i, '.webp');
        const outputPath = path.join(outputDir, outputFileName);
        
        try {
            if (!fs.existsSync(inputPath)) {
                console.log(`⚠ Arquivo não encontrado: ${file}`);
                continue;
            }
            
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
