// Sistema de Roteamento para CEPPEMBU
class Router {
    constructor() {
        this.routes = {
            'dashboard': 'dashboard',
            'cadastrar-membro': 'cadastrar-membro',
            'membros': 'membros',
            'relatorios': 'relatorios',
            'aniversarios': 'aniversarios'
        };
        this.init();
    }

    init() {
        // Escutar mudanças na URL
        window.addEventListener('popstate', (e) => {
            this.handleRoute();
        });

        // Carregar rota inicial
        this.handleRoute();
    }

    navigateTo(route, clickedElement = null) {
        // Atualizar URL sem recarregar página
        const url = route === 'dashboard' ? '/' : `/${route}`;
        console.log('🧭 Navegando para:', route, 'URL:', url);
        history.pushState({}, '', url);
        
        // Mostrar seção correspondente
        this.showSection(route, clickedElement);
    }

    handleRoute() {
        const path = window.location.pathname;
        let route = 'dashboard'; // padrão

        if (path === '/' || path === '') {
            route = 'dashboard';
        } else {
            const pathSegments = path.split('/').filter(segment => segment);
            if (pathSegments.length > 0) {
                const routeName = pathSegments[0];
                if (this.routes[routeName]) {
                    route = routeName;
                }
            }
        }

        this.showSection(route);
    }

    showSection(sectionId, clickedElement = null) {
        // Esconder todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar seção selecionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Atualizar menu ativo
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adicionar classe ativa ao link clicado
        if (clickedElement) {
            clickedElement.classList.add('active');
        } else {
            // Se não foi passado o elemento, encontrar pelo data-section
            const correspondingLink = document.querySelector(`[data-section="${sectionId}"]`);
            if (correspondingLink) {
                correspondingLink.classList.add('active');
            }
        }
        
        // Atualizar dados específicos da seção
        if (sectionId === 'relatorios') {
            console.log('📊 Navegando para relatórios, iniciando carregamento...');
            console.log('📊 Window.igreja existe?', !!window.igreja);
            
            if (window.igreja) {
                setTimeout(() => {
                    console.log('📊 Chamando gerarRelatorios...');
                    window.igreja.gerarRelatorios();
                }, 100);
            } else {
                console.log('❌ Igreja manager não encontrado');
            }
        } else if (sectionId === 'membros') {
            if (window.igreja) {
                window.igreja.carregarMembros();
            }
        } else if (sectionId === 'aniversarios') {
            if (window.igreja) {
                window.igreja.carregarAniversarios();
            }
        } else if (sectionId === 'dashboard') {
            if (window.igreja) {
                window.igreja.atualizarDashboard();
            }
        }
    }
}

// Função de navegação (mantida para compatibilidade)
function showSection(sectionId, clickedElement) {
    if (window.router) {
        window.router.navigateTo(sectionId, clickedElement);
    }
}
