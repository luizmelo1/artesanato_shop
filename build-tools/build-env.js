#!/usr/bin/env node

/**
 * Script de Build usando Variáveis de Ambiente
 * 
 * Este script lê credenciais de .env e injeta nos arquivos HTML
 * Abordagem mais limpa e padrão da indústria
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler arquivo .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error(' Arquivo .env não encontrado!');
    console.error(' Copie .env.example para .env e configure suas credenciais.');
    process.exit(1);
  }

  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}🔧 Injetando credenciais do .env...${colors.reset}\n`);

try {
  const env = loadEnv();
  
  // Validar variáveis obrigatórias
  const required = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];

  const missing = required.filter(key => !env[key] || env[key] === 'YOUR_API_KEY_HERE' || env[key].includes('your-project'));
  
  if (missing.length > 0) {
    console.error(`${colors.yellow}  Variáveis não configuradas no .env:${colors.reset}`);
    missing.forEach(key => console.error(`   - ${key}`));
    console.error(`\n${colors.yellow}Configure todas as variáveis e tente novamente.${colors.reset}\n`);
    process.exit(1);
  }

  const filesToProcess = [
    'products.html',
    'index.html',
    'src/js/firebase-config-template.js'
  ];

  // Substituir placeholders com valores do .env
  const replacements = {
    'PLACEHOLDER_API_KEY': env.FIREBASE_API_KEY,
    'PLACEHOLDER_AUTH_DOMAIN': env.FIREBASE_AUTH_DOMAIN,
    'PLACEHOLDER_PROJECT_ID': env.FIREBASE_PROJECT_ID,
    'PLACEHOLDER_STORAGE_BUCKET': env.FIREBASE_STORAGE_BUCKET,
    'PLACEHOLDER_SENDER_ID': env.FIREBASE_MESSAGING_SENDER_ID,
    'PLACEHOLDER_APP_ID': env.FIREBASE_APP_ID
  };

  filesToProcess.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⏭  Pulando ${file} (não existe)`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    fs.writeFileSync(filePath, content);
    console.log(`${colors.green} ${file} processado${colors.reset}`);
  });

  console.log(`\n${colors.green} Build concluído! Pronto para deploy.${colors.reset}\n`);

} catch (error) {
  console.error(`\n Erro: ${error.message}\n`);
  process.exit(1);
}
