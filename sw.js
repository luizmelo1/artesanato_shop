/**
 * Service Worker para PWA - Ateliê Arte Criativa
 * Implementa estratégias de cache para funcionamento offline
 * Versão: 1.0.0
 */

// Nome do cache e versão - incrementar ao fazer atualizações
const CACHE_NAME = 'atelie-arte-criativa-v1';
const RUNTIME_CACHE = 'atelie-runtime-v1';

// Recursos essenciais para cache na instalação (App Shell)
// Usando caminhos relativos ao scope do Service Worker
const STATIC_ASSETS = [
  './',
  './index.html',
  './products.html',
  './offline.html',
  './manifest.json',
  './src/css/style.css',
  './src/css/base.css',
  './src/css/layout.css',
  './src/css/components.css',
  './src/css/utils/pwa.css',
  './src/js/main-modular.js',
  './src/js/utils/debug.js',
  './src/img/icons/logo.webp'
];

// Padrões de URL para diferentes estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First - recursos estáticos que raramente mudam
  cacheFirst: [
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /\.(?:woff|woff2|ttf|eot)$/,
    /\/src\/css\//,
    /\/src\/js\//
  ],
  // Network First - APIs e conteúdo dinâmico
  networkFirst: [
    /\/products\.json$/,
    /\/api\//
  ],
  // Stale While Revalidate - recursos que podem ser um pouco desatualizados
  staleWhileRevalidate: [
    /https:\/\/images\.unsplash\.com/,
    /https:\/\/.*\.githubusercontent\.com/
  ]
};

/**
 * Evento de instalação do Service Worker
 * Faz o cache inicial dos recursos estáticos
 */
globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando recursos estáticos');
        // Cacheia recursos um por um para identificar falhas
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Falha ao cachear ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Service Worker instalado com sucesso');
        // Força a ativação imediata
        return globalThis.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear recursos:', error);
      })
  );
});

/**
 * Evento de ativação do Service Worker
 * Limpa caches antigos
 */
globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove caches que não são da versão atual
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        // Assume controle imediato de todas as páginas
        return globalThis.clients.claim();
      })
  );
});

/**
 * Verifica qual estratégia de cache usar para uma URL
 */
function getCacheStrategy(url) {
  const urlString = url.toString();
  
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(urlString)) return 'cacheFirst';
  }
  
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(urlString)) return 'networkFirst';
  }
  
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (pattern.test(urlString)) return 'staleWhileRevalidate';
  }
  
  return 'networkFirst'; // Padrão
}

/**
 * Estratégia Cache First
 * Tenta buscar do cache primeiro, se não encontrar busca da rede
 */
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    // Cacheia apenas respostas válidas
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Se falhar, tenta buscar página offline
    if (request.mode === 'navigate') {
      return caches.match('./offline.html');
    }
    throw error;
  }
}

/**
 * Estratégia Network First
 * Tenta buscar da rede primeiro, se falhar usa o cache
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    // Cacheia apenas respostas válidas
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Se for navegação e não tem cache, mostra página offline
    if (request.mode === 'navigate') {
      return caches.match('./offline.html');
    }
    throw error;
  }
}

/**
 * Estratégia Stale While Revalidate
 * Retorna do cache imediatamente e atualiza em background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  // Busca em background e atualiza o cache
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // Ignora erros em background
    });
  
  // Retorna cache imediatamente se disponível, senão espera a rede
  return cached || fetchPromise;
}

/**
 * Evento de fetch - intercepta todas as requisições
 * Aplica estratégias de cache baseadas no tipo de recurso
 */
globalThis.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora requisições de outros domínios (exceto CDNs conhecidas)
  const url = new URL(event.request.url);
  const isOwnDomain = url.origin === location.origin;
  const isTrustedCDN = url.hostname.includes('unsplash.com') || 
                       url.hostname.includes('githubusercontent.com');
  
  if (!isOwnDomain && !isTrustedCDN) {
    return;
  }
  
  // Determina e aplica a estratégia de cache
  const strategy = getCacheStrategy(event.request.url);
  
  event.respondWith(
    (async () => {
      switch (strategy) {
        case 'cacheFirst':
          return cacheFirst(event.request);
        case 'networkFirst':
          return networkFirst(event.request);
        case 'staleWhileRevalidate':
          return staleWhileRevalidate(event.request);
        default:
          return networkFirst(event.request);
      }
    })()
  );
});

/**
 * Evento de mensagem - permite comunicação com a aplicação
 * Útil para forçar atualização ou limpar cache
 */
globalThis.addEventListener('message', (event) => {
  // Verifica origem por segurança (apenas do mesmo domínio)
  if (event.origin !== location.origin) {
    return;
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    globalThis.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Evento de sync em background (para funcionalidades futuras)
 * Permite sincronização quando a conexão for restaurada
 */
globalThis.addEventListener('sync', (event) => {
  if (event.tag === 'sync-products') {
    event.waitUntil(
      // Implementar lógica de sincronização aqui
      Promise.resolve()
    );
  }
});

/**
 * Evento de push notification (para funcionalidades futuras)
 * Permite receber notificações push
 */
globalThis.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: './src/img/icons/logo.webp',
    badge: './src/img/icons/logo.webp',
    vibrate: [200, 100, 200],
    tag: 'atelie-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    globalThis.registration.showNotification('Ateliê Arte Criativa', options)
  );
});

/**
 * Evento de clique em notificação
 */
globalThis.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});
