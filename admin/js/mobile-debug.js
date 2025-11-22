// Script de debug para mobile
// Adiciona logs visíveis na tela

(function() {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'mobile-debug';
    debugDiv.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.9);
        color: #0f0;
        padding: 10px;
        font-size: 11px;
        font-family: monospace;
        max-height: 150px;
        overflow-y: auto;
        z-index: 99999;
        display: none;
    `;
    document.body.appendChild(debugDiv);
    
    const logs = [];
    const maxLogs = 20;
    
    globalThis.mobileLog = function(...args) {
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        const time = new Date().toLocaleTimeString();
        logs.unshift(`[${time}] ${message}`);
        
        if (logs.length > maxLogs) logs.pop();
        
        debugDiv.innerHTML = logs.join('<br>');
        debugDiv.style.display = 'block';
        
        console.log(...args);
    };
    
    globalThis.clearMobileLog = function() {
        logs.length = 0;
        debugDiv.innerHTML = '';
        debugDiv.style.display = 'none';
    };
    
    // Intercepta console.log
    const originalLog = console.log;
    console.log = function(...args) {
        globalThis.mobileLog(...args);
        originalLog.apply(console, args);
    };
    
    // Intercepta console.error
    const originalError = console.error;
    console.error = function(...args) {
        globalThis.mobileLog('ERROR:', ...args);
        originalError.apply(console, args);
    };
    
    mobileLog('Mobile Debug iniciado');
    
    // Adiciona botão para limpar logs
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '✕';
    clearBtn.style.cssText = `
        position: fixed;
        bottom: 160px;
        right: 10px;
        background: #f00;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 20px;
        z-index: 100000;
        cursor: pointer;
    `;
    clearBtn.onclick = clearMobileLog;
    document.body.appendChild(clearBtn);
})();
