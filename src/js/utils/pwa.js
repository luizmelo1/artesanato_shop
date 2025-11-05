/**
 * PWA Utilities - Gerenciamento do Service Worker e instalação
 * Ateliê Arte Criativa
 */

import { debugLog, debugWarn, debugError } from './debug.js';

/**
 * Registra o Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    debugWarn('Service Worker não é suportado neste navegador');
    return null;
  }

  try {
    // Detecta o caminho base da aplicação
    const path = globalThis.location.pathname;
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    const swPath = `${base}sw.js`;
    
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: base
    });

    debugLog('Service Worker registrado com sucesso:', registration);
    debugLog('Scope:', registration.scope);

    // Verifica por atualizações a cada hora
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Escuta por atualizações do Service Worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Novo Service Worker instalado, notifica o usuário
          showUpdateNotification();
        }
      });
    });

    return registration;
  } catch (error) {
    debugError('Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Mostra notificação de atualização disponível
 */
function showUpdateNotification() {
  // Cria elemento de notificação
  const notification = document.createElement('div');
  notification.className = 'pwa-update-notification';
  notification.innerHTML = `
    <div class="pwa-update-content">
      <p>Nova versão disponível!</p>
      <button class="pwa-update-btn">Atualizar</button>
      <button class="pwa-dismiss-btn">Depois</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Adiciona estilos inline para evitar dependência de CSS
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(230, 93, 30, 0.95);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  
  // Botão de atualizar
  const updateBtn = notification.querySelector('.pwa-update-btn');
  updateBtn.style.cssText = `
    background: white;
    color: #E65D1E;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    margin-right: 0.5rem;
  `;
  
  updateBtn.addEventListener('click', () => {
    globalThis.location.reload();
  });
  
  // Botão de dispensar
  const dismissBtn = notification.querySelector('.pwa-dismiss-btn');
  dismissBtn.style.cssText = `
    background: transparent;
    color: white;
    border: 1px solid white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  `;
  
  dismissBtn.addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Gerencia o prompt de instalação do PWA
 */
export function setupInstallPrompt() {
  let deferredPrompt = null;

  // Escuta o evento beforeinstallprompt
  globalThis.addEventListener('beforeinstallprompt', (e) => {
    // Previne o prompt automático
    e.preventDefault();
    deferredPrompt = e;
    
    debugLog('PWA pode ser instalado');
    
    // Mostra botão de instalação customizado
    showInstallButton(deferredPrompt);
  });

  // Escuta quando o app é instalado
  globalThis.addEventListener('appinstalled', () => {
    debugLog('PWA instalado com sucesso');
    deferredPrompt = null;
    hideInstallButton();
  });
}

/**
 * Mostra botão de instalação do PWA
 */
function showInstallButton(deferredPrompt) {
  const installBtn = document.getElementById('install-pwa-btn');
  
  if (!installBtn) {
    // Cria botão se não existir
    const btn = document.createElement('button');
    btn.id = 'install-pwa-btn';
    btn.className = 'pwa-install-btn';
    btn.innerHTML = '📱 Instalar App';
    btn.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #E65D1E;
      color: white;
      border: none;
      padding: 0.8rem 1.2rem;
      border-radius: 50px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(230, 93, 30, 0.3);
      z-index: 999;
      transition: all 0.3s ease;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 20px rgba(230, 93, 30, 0.4)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 15px rgba(230, 93, 30, 0.3)';
    });
    
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        return;
      }
      
      // Mostra o prompt de instalação
      deferredPrompt.prompt();
      
      // Espera pela escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      debugLog('Escolha do usuário:', outcome);
      
      if (outcome === 'accepted') {
        debugLog('Usuário aceitou instalar o PWA');
      } else {
        debugLog('Usuário recusou instalar o PWA');
      }
      
      // Limpa o prompt
      deferredPrompt = null;
      btn.remove();
    });
    
    document.body.appendChild(btn);
  }
}

/**
 * Esconde botão de instalação
 */
function hideInstallButton() {
  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.remove();
  }
}

/**
 * Verifica se o app está sendo executado como PWA
 */
export function isPWA() {
  return globalThis.matchMedia('(display-mode: standalone)').matches ||
         globalThis.navigator.standalone === true;
}

/**
 * Atualiza status da conexão
 */
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  
  if (isOnline) {
    debugLog('Conexão restaurada');
    hideOfflineNotification();
  } else {
    debugWarn('Conexão perdida - modo offline');
    showOfflineNotification();
  }
}

/**
 * Monitora o status da conexão
 */
export function setupConnectionMonitor() {
  globalThis.addEventListener('online', updateOnlineStatus);
  globalThis.addEventListener('offline', updateOnlineStatus);
  
  // Verifica status inicial
  updateOnlineStatus();
}

/**
 * Mostra notificação de offline
 */
function showOfflineNotification() {
  if (document.getElementById('offline-notification')) {
    return;
  }
  
  const notification = document.createElement('div');
  notification.id = 'offline-notification';
  notification.innerHTML = `
    <div class="offline-content">
      📡 Você está offline. Navegue pelas páginas já visitadas.
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #333;
    color: white;
    padding: 0.8rem;
    text-align: center;
    z-index: 10000;
    animation: slideDown 0.3s ease;
  `;
  
  document.body.appendChild(notification);
}

/**
 * Esconde notificação de offline
 */
function hideOfflineNotification() {
  const notification = document.getElementById('offline-notification');
  if (notification) {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

/**
 * Inicializa todas as funcionalidades PWA
 */
export async function initPWA() {
  debugLog('Inicializando PWA...');
  
  // Registra Service Worker
  await registerServiceWorker();
  
  // Configura prompt de instalação
  setupInstallPrompt();
  
  // Monitora conexão
  setupConnectionMonitor();
  
  // Log se está rodando como PWA
  if (isPWA()) {
    debugLog('Executando como PWA instalado');
  }
  
  debugLog('PWA inicializado com sucesso');
}
