// Script de Migração de Dados
// Este script transfere os produtos do products.json para o Firestore

// INSTRUÇÕES DE USO:
// 1. Abra admin/dashboard.html no navegador
// 2. Faça login
// 3. Abra o Console do navegador (F12)
// 4. Copie e cole este script completo
// 5. Pressione Enter
// 6. Aguarde a mensagem "Migração concluída!"

// Este arquivo deve ser executado no console do navegador, então a regra não se aplica
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
    console.log('🚀 Iniciando migração de produtos...');
    
    try {
        // 1. Buscar produtos do JSON
        console.log('📥 Buscando produtos do arquivo JSON...');
        const response = await fetch('../src/db/products.json');
        const products = await response.json();
        console.log(`✅ ${products.length} produtos encontrados`);
        
        // 2. Extrair categorias únicas
        const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
        console.log(`📋 ${categories.length} categorias encontradas:`, categories);
        
        // 3. Criar categorias no Firestore
        console.log('🏷️ Criando categorias...');
        const categoryMap = {};
        
        for (const categoryName of categories) {
            const categoryData = {
                name: categoryName,
                description: '',
                active: true,
                productCount: products.filter(p => p.category === categoryName).length,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await db.collection('categories').add(categoryData);
            categoryMap[categoryName] = docRef.id;
            console.log(`  ✓ ${categoryName}`);
        }
        
        // 4. Criar produtos no Firestore
        console.log('📦 Criando produtos...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const product of products) {
            try {
                // Converter paths de imagem
                let imagePath = product.image || '';
                
                // Se a imagem estiver em webp/funkopop ou webp/rosas, ajustar path
                if (imagePath.includes('webp/funkopop')) {
                    imagePath = imagePath.replace('webp/funkopop', 'produtos/funkopop/webp');
                } else if (imagePath.includes('webp/rosas')) {
                    imagePath = imagePath.replace('webp/rosas', 'produtos/rosas/webp');
                }
                
                const productData = {
                    name: product.name || 'Sem nome',
                    category: product.category || 'Sem categoria',
                    price: Number(product.price) || 0,
                    description: product.description || '',
                    link: product.link || '',
                    image: imagePath ? `../src/img/${imagePath}` : '',
                    active: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await db.collection('products').add(productData);
                successCount++;
                console.log(`  ✓ ${product.name}`);
                
            } catch (error) {
                errorCount++;
                console.error(`  ✗ Erro em ${product.name}:`, error);
            }
        }
        
        console.log('\n✅ MIGRAÇÃO CONCLUÍDA!');
        console.log(`📊 Resumo:`);
        console.log(`   • ${categories.length} categorias criadas`);
        console.log(`   • ${successCount} produtos migrados com sucesso`);
        console.log(`   • ${errorCount} erros`);
        console.log('\n💡 Próximos passos:');
        console.log('   1. Verifique os dados em "Produtos" e "Categorias"');
        console.log('   2. Ajuste descrições e links conforme necessário');
        console.log('   3. Faça upload de novas imagens se necessário');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        console.log('Verifique se:');
        console.log('  • Você está logado no painel admin');
        console.log('  • O Firebase está configurado corretamente');
        console.log('  • As regras do Firestore permitem escrita');
    }
})();

// NOTA: Este script só precisa ser executado UMA VEZ!
// Depois que os dados estiverem no Firestore, você pode deletar o products.json
