// Sistema de Autenticação
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('ceppembu_token');
        this.init();
    }

    init() {
        // Verificar se há token válido
        if (this.token) {
            this.verifyToken();
        } else {
            this.showLogin();
        }
    }

    async verifyToken() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.data;
                this.hideLogin();
                this.showUserBar();
                this.updateNavigation();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            this.logout();
        }
    }

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.token = result.data.token;
                this.currentUser = result.data.user;
                
                // Salvar token no localStorage
                localStorage.setItem('ceppembu_token', this.token);
                
                // Esconder login e mostrar interface
                this.hideLogin();
                this.showUserBar();
                this.updateNavigation();
                
                // Mostrar notificação de sucesso após um pequeno delay
                setTimeout(() => {
                    if (window.igreja) {
                        const roleText = this.currentUser.role === 'admin' ? 'Administrador' : 
                                       this.currentUser.role === 'secretaria' ? 'Secretaria' : 'Membro';
                        window.igreja.mostrarNotificacao('✓ Bem-vindo(a)!', `Olá, ${this.currentUser.nome} (${roleText})`, 'success', 4000);
                    }
                }, 300);
                
                return true;
            } else {
                // Mostrar erro
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Erro no Login', result.error || 'Usuário ou senha incorretos', 'error', 4000);
                }
                return false;
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            if (window.igreja) {
                window.igreja.mostrarNotificacao('Erro de Conexão', 'Não foi possível conectar ao servidor. Tente novamente.', 'error', 4000);
            }
            return false;
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            // Limpar dados locais
            this.token = null;
            this.currentUser = null;
            localStorage.removeItem('ceppembu_token');
            
            // Limpar campos de login
            const usernameField = document.getElementById('username');
            const passwordField = document.getElementById('password');
            if (usernameField) usernameField.value = '';
            if (passwordField) passwordField.value = '';
            
            // Mostrar login
            this.showLogin();
            this.hideUserBar();
            this.updateNavigation();
            
            // Mostrar notificação de logout
            if (window.igreja) {
                window.igreja.mostrarNotificacao('✓ Logout Realizado', 'Você foi desconectado com sucesso. Até breve!', 'info', 3000);
            }
        }
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const mainHeader = document.getElementById('mainHeader');
        const mainNavbar = document.getElementById('mainNavbar');
        const mainContent = document.getElementById('mainContent');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainHeader) mainHeader.style.display = 'none';
        if (mainNavbar) mainNavbar.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
    }

    hideLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const mainHeader = document.getElementById('mainHeader');
        const mainNavbar = document.getElementById('mainNavbar');
        const mainContent = document.getElementById('mainContent');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainHeader) mainHeader.style.display = 'block';
        if (mainNavbar) mainNavbar.style.display = 'block';
        if (mainContent) mainContent.style.display = 'block';
        
        // Configurar permissões baseadas no role do usuário
        if (this.currentUser && window.configurarPermissoes) {
            window.configurarPermissoes(this.currentUser.role);
        }
        
        // Atualizar navegação após configurar permissões
        this.updateNavigation();
    }

    showUserBar() {
        const headerUserInfo = document.getElementById('headerUserInfo');
        const userNameHeader = document.querySelector('.user-name-header');
        const userRoleHeader = document.querySelector('.user-role-header');
        const logoutBtnHeader = document.getElementById('logoutBtnHeader');

        if (headerUserInfo && this.currentUser) {
            if (userNameHeader) {
                userNameHeader.textContent = this.currentUser.nome;
            }
            if (userRoleHeader) {
                userRoleHeader.textContent = this.currentUser.role === 'admin' ? 'Administrador' : 
                                           this.currentUser.role === 'secretaria' ? 'Secretaria' : 'Membro';
            }
            
            headerUserInfo.style.display = 'flex';
        }
    }

    // Método para renderizar gerenciamento de usuários
    renderUserManagement() {
        // Navegar para a seção de usuários
        if (window.router) {
            window.router.navigateTo('usuarios');
        }
        
        // Carregar lista de usuários
        if (window.carregarUsuarios) {
            window.carregarUsuarios();
        }
    }

    hideUserBar() {
        const headerUserInfo = document.getElementById('headerUserInfo');
        if (headerUserInfo) {
            headerUserInfo.style.display = 'none';
        }
    }

    updateNavigation() {
        // Atualizar navegação baseada no role do usuário
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        navLinks.forEach(link => {
            const section = link.getAttribute('data-section');
            
            // Sempre mostrar dashboard
            if (section === 'dashboard') return;
            
            // Mostrar/ocultar seções baseado no role
            if (this.currentUser) {
                if (this.currentUser.role === 'admin') {
                    // Admin vê tudo
                    link.style.display = 'flex';
                } else if (this.currentUser.role === 'secretaria') {
                    // Secretaria vê tudo exceto gerenciamento de usuários
                    link.style.display = 'flex';
                } else {
                    // Usuário comum (membro) vê dashboard, membros, relatórios e aniversários
                    const allowedSections = ['membros', 'relatorios', 'aniversarios'];
                    link.style.display = allowedSections.includes(section) ? 'flex' : 'none';
                }
            } else {
                // Não logado - mostrar apenas login
                link.style.display = 'none';
            }
        });
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isSecretaria() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'secretaria');
    }

    canEdit() {
        return this.isSecretaria();
    }

    canDelete() {
        return this.isAdmin();
    }
}

// Gerenciador de Usuários
class UserManager {
    constructor() {
        this.users = [];
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/auth/users', {
                headers: window.auth.getAuthHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                this.users = result.data;
                return result.data;
            } else {
                throw new Error('Erro ao carregar usuários');
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            if (window.igreja) {
                window.igreja.mostrarNotificacao('Erro', 'Erro ao carregar usuários', 'error');
            }
            return [];
        }
    }

    async createUser(userData) {
        try {
            const response = await fetch('/api/auth/users', {
                method: 'POST',
                headers: window.auth.getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Sucesso', 'Usuário criado com sucesso!', 'success');
                }
                return result.data;
            } else {
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Erro', result.error, 'error');
                }
                return null;
            }
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            if (window.igreja) {
                window.igreja.mostrarNotificacao('Erro', 'Erro ao criar usuário', 'error');
            }
            return null;
        }
    }

    async updateUser(userId, userData) {
        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'PUT',
                headers: window.auth.getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Sucesso', 'Usuário atualizado com sucesso!', 'success');
                }
                return result.data;
            } else {
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Erro', result.error, 'error');
                }
                return null;
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            if (window.igreja) {
                window.igreja.mostrarNotificacao('Erro', 'Erro ao atualizar usuário', 'error');
            }
            return null;
        }
    }

    async deleteUser(userId) {
        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: window.auth.getAuthHeaders()
            });

            const result = await response.json();

            if (result.success) {
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Sucesso', 'Usuário deletado com sucesso!', 'success');
                }
                return true;
            } else {
                if (window.igreja) {
                    window.igreja.mostrarNotificacao('Erro', result.error, 'error');
                }
                return false;
            }
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            if (window.igreja) {
                window.igreja.mostrarNotificacao('Erro', 'Erro ao deletar usuário', 'error');
            }
            return false;
        }
    }

    renderUserManagement() {
        // Criar modal de gerenciamento de usuários
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content users-management">
                <div class="modal-header">
                    <h3><i class="fas fa-users-cog"></i> Gerenciar Usuários</h3>
                    <button class="close-modal" data-close="modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="usersList"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');

        // Carregar e renderizar usuários
        this.loadUsers().then(users => {
            this.renderUsersList(users);
        });
    }

    renderUsersList(users) {
        const container = document.getElementById('usersList');
        if (!container) return;

        container.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-header">
                    <div>
                        <h4>${user.nome}</h4>
                        <span class="role-badge role-${user.role}">${user.role}</span>
                        <span class="status-badge status-${user.ativo ? 'active' : 'inactive'}">
                            ${user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <div class="user-actions-inline">
                        <button class="btn btn-sm btn-secondary" onclick="window.userManager.editUser(${user.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.userManager.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> Deletar
                        </button>
                    </div>
                </div>
                <div class="user-details">
                    <div class="user-detail">
                        <label>Username</label>
                        <span>${user.username}</span>
                    </div>
                    <div class="user-detail">
                        <label>Email</label>
                        <span>${user.email}</span>
                    </div>
                    <div class="user-detail">
                        <label>Ministério</label>
                        <span>${user.ministerio || 'Não definido'}</span>
                    </div>
                    <div class="user-detail">
                        <label>Último Login</label>
                        <span>${user.ultimo_login ? new Date(user.ultimo_login).toLocaleString() : 'Nunca'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    editUser(userId) {
        // Implementar edição de usuário
        console.log('Editar usuário:', userId);
    }
}

// Inicializar sistema de autenticação
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
    window.userManager = new UserManager();
});
