#!/usr/bin/env node

/**
 * Script Automatizado de Deploy
 * 
 * Este script:
 * 1. Injeta as credenciais Firebase nos arquivos HTML
 * 2. Faz o deploy para Firebase Hosting
 * 3. Restaura os placeholders nos arquivos HTML (segurança)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function step(num, message) {
  log(`\n${colors.bright}[${num}/4]${colors.reset} ${message}`);
}

try {
  log('\n Iniciando processo de deploy...\n', colors.bright);

  // Passo 1: Fazer backup dos arquivos originais
  step(1, 'Fazendo backup dos arquivos...');
  const filesToBackup = [
    'products.html',
    'index.html',
    'src/js/firebase-config-template.js'
  ];
  const backups = {};
  
  filesToBackup.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      backups[file] = fs.readFileSync(filePath, 'utf8');
      log(`   ✓ ${file} backup criado`, colors.green);
    }
  });

  // Passo 2: Injetar credenciais
  step(2, 'Injetando credenciais do .env...');
  execSync('node build-tools/build-env.js', { stdio: 'inherit' });

  // Passo 3: Deploy
  step(3, 'Fazendo deploy para Firebase Hosting...');
  log('   (Isso pode levar alguns segundos...)\n', colors.yellow);
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });

  // Passo 4: Restaurar arquivos originais
  step(4, 'Restaurando placeholders nos arquivos...');
  Object.entries(backups).forEach(([file, content]) => {
    const filePath = path.join(__dirname, '..', file);
    fs.writeFileSync(filePath, content);
    log(`   ✓ ${file} restaurado`, colors.green);
  });

  log('\n Deploy concluído com sucesso!', colors.bright + colors.green);
  log(' Arquivos locais protegidos (placeholders restaurados)\n', colors.blue);

} catch (error) {
  log('\n Erro durante o deploy:', colors.red);
  console.error(error.message);
  
  // Tentar restaurar backups em caso de erro
  if (Object.keys(backups).length > 0) {
    log('\n Restaurando backups...', colors.yellow);
    Object.entries(backups).forEach(([file, content]) => {
      const filePath = path.join(__dirname, '..', file);
      fs.writeFileSync(filePath, content);
    });
    log('✓ Backups restaurados\n', colors.green);
  }
  
  process.exit(1);
}
