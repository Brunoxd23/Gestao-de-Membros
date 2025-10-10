// Sistema de Gestão de Membros - CEPPEMBU (Versão com Banco de Dados)
class IgrejaManagerAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.verificarConexao();
        this.atualizarDashboard();
        this.renderizarMembros();
        this.configurarMesAtual();
    }

    setupEventListeners() {
        // Formulário de cadastro
        document.getElementById('formCadastro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarMembro();
        });

        // Busca de membros
        document.getElementById('searchMembros').addEventListener('input', (e) => {
            this.filtrarMembros();
        });

        document.getElementById('filterTipo').addEventListener('change', (e) => {
            this.filtrarMembros();
        });

        // Selecionar mês atual por padrão
        const hoje = new Date();
        document.getElementById('mesAniversario').value = hoje.getMonth();
    }

    // Verificar conexão com a API
    async verificarConexao() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            
            if (data.status === 'OK') {
                console.log('✅ Conectado à API:', data);
                // Só mostra mensagem na primeira vez ou se houver erro
                const jaConectou = localStorage.getItem('ceppembu_ja_conectou');
                if (!jaConectou) {
                    this.mostrarMensagem('Sistema conectado ao banco de dados!', 'success');
                    localStorage.setItem('ceppembu_ja_conectou', 'true');
                }
            }
        } catch (error) {
            console.error('❌ Erro na conexão com a API:', error);
            this.mostrarMensagem('Erro na conexão com o servidor. Verifique se o backend está rodando.', 'error');
        }
    }

    // Função auxiliar para fazer requisições
    async fazerRequisicao(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // Cadastrar novo membro
    async cadastrarMembro() {
        const form = document.getElementById('formCadastro');
        const formData = new FormData(form);
        
        const novoMembro = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            data_nascimento: formData.get('dataNascimento'),
            data_batismo: formData.get('dataBatismo'),
            endereco: formData.get('endereco'),
            cidade: formData.get('cidade'),
            tipo_membro: formData.get('tipoMembro'),
            ministerio: formData.get('ministerio'),
            observacoes: formData.get('observacoes')
        };

        try {
            const response = await this.fazerRequisicao('/membros', {
                method: 'POST',
                body: JSON.stringify(novoMembro)
            });

            form.reset();
            // Recarregar página com spinner (notificação será mostrada pela função)
            this.recarregarPaginaComSpinner('Cadastrando...', 'Atualizando lista de membros', true, 'Membro Cadastrado!', 'Novo membro adicionado com sucesso à igreja!', true);
        } catch (error) {
            this.mostrarMensagem(error.message || 'Erro ao cadastrar membro', 'error');
        }
    }

    // Atualizar dashboard
    async atualizarDashboard() {
        try {
            const response = await this.fazerRequisicao('/membros/stats/dashboard');
            const stats = response.data;

            document.getElementById('totalMembros').textContent = stats.total_membros || 0;
            document.getElementById('membrosAtivos').textContent = stats.membros_ativos || 0;
            document.getElementById('visitantes').textContent = stats.visitantes || 0;
            
            // Buscar aniversários do dia
            const aniversariosResponse = await this.fazerRequisicao('/aniversarios/hoje');
            document.getElementById('aniversariosHoje').textContent = aniversariosResponse.total || 0;
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        }
    }

    // Renderizar lista de membros
    async renderizarMembros() {
        const container = document.getElementById('listaMembros');
        const filtro = document.getElementById('filterTipo').value;
        const busca = document.getElementById('searchMembros').value;

        try {
            const params = new URLSearchParams();
            if (filtro) params.append('tipo', filtro);
            if (busca) params.append('busca', busca);

            const response = await this.fazerRequisicao(`/membros?${params.toString()}`);
            const membros = response.data;

            if (membros.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>Nenhum membro encontrado</h3>
                        <p>Cadastre o primeiro membro da igreja!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = membros.map(membro => {
                // Formatar data de nascimento para exibição
                const dataNascimento = membro.data_nascimento ? 
                    new Date(membro.data_nascimento).toLocaleDateString('pt-BR') : '';
                
                return `
                <div class="member-card">
                    <div class="member-info">
                        <h3>${membro.nome}</h3>
                        ${membro.email ? `<p><i class="fas fa-envelope"></i> ${membro.email}</p>` : ''}
                        ${membro.telefone ? `<p><i class="fas fa-phone"></i> ${membro.telefone}</p>` : ''}
                        ${dataNascimento ? `<p><i class="fas fa-birthday-cake"></i> ${dataNascimento}</p>` : ''}
                        ${membro.ministerio ? `<p><i class="fas fa-church"></i> ${this.formatarMinisterio(membro.ministerio)}</p>` : ''}
                        ${membro.observacoes ? `<p class="observacoes"><i class="fas fa-sticky-note"></i> ${membro.observacoes}</p>` : ''}
                        <span class="tipo-badge ${membro.tipo_membro}">${this.formatarTipo(membro.tipo_membro)}</span>
                    </div>
                    <div class="member-actions">
                        <button class="btn-edit" data-action="edit" data-id="${membro.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${membro.telefone ? `<button class="btn-whatsapp" data-action="whatsapp" data-phone="${membro.telefone}" data-name="${membro.nome}" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>` : ''}
                        ${membro.email ? `<button class="btn-email" data-action="email" data-email="${membro.email}" data-name="${membro.nome}" title="Email">
                            <i class="fas fa-envelope"></i>
                        </button>` : ''}
                        <button class="btn-delete" data-action="delete" data-id="${membro.id}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            }).join('');
        } catch (error) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar membros</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Filtrar membros
    async filtrarMembros() {
        await this.renderizarMembros();
    }

    // Editar membro
    async editarMembro(id) {
        try {
            const response = await this.fazerRequisicao(`/membros/${id}`);
            const membro = response.data;

            const modal = document.getElementById('modalEdicao');
            const form = document.getElementById('formEdicao');

            form.innerHTML = `
                <div class="form-group">
                    <label for="editNome">Nome Completo *</label>
                    <input type="text" id="editNome" name="nome" value="${membro.nome}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" name="email" value="${membro.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editTelefone">WhatsApp</label>
                        <input type="tel" id="editTelefone" name="telefone" value="${membro.telefone || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="editDataNascimento">Data de Nascimento</label>
                        <input type="date" id="editDataNascimento" name="dataNascimento" value="${membro.data_nascimento || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editDataBatismo">Data de Batismo</label>
                        <input type="date" id="editDataBatismo" name="dataBatismo" value="${membro.data_batismo || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="editEndereco">Endereço</label>
                        <input type="text" id="editEndereco" name="endereco" value="${membro.endereco || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editCidade">Cidade</label>
                        <input type="text" id="editCidade" name="cidade" value="${membro.cidade || ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="editTipoMembro">Tipo *</label>
                    <select id="editTipoMembro" name="tipoMembro" required>
                        <option value="membro" ${membro.tipo_membro === 'membro' ? 'selected' : ''}>Membro</option>
                        <option value="visitante" ${membro.tipo_membro === 'visitante' ? 'selected' : ''}>Visitante</option>
                        <option value="novo-convertido" ${membro.tipo_membro === 'novo-convertido' ? 'selected' : ''}>Novo Convertido</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="editMinisterio">Ministério</label>
                    <select id="editMinisterio" name="ministerio">
                        <option value="">Selecione...</option>
                        <option value="pastor" ${membro.ministerio === 'pastor' ? 'selected' : ''}>Pastor</option>
                        <option value="louvor" ${membro.ministerio === 'louvor' ? 'selected' : ''}>Louvor</option>
                        <option value="infantil" ${membro.ministerio === 'infantil' ? 'selected' : ''}>Infantil</option>
                        <option value="jovens" ${membro.ministerio === 'jovens' ? 'selected' : ''}>Jovens</option>
                        <option value="senhores" ${membro.ministerio === 'senhores' ? 'selected' : ''}>Senhores</option>
                        <option value="senhoras" ${membro.ministerio === 'senhoras' ? 'selected' : ''}>Senhoras</option>
                        <option value="evangelismo" ${membro.ministerio === 'evangelismo' ? 'selected' : ''}>Evangelismo</option>
                        <option value="diaconia" ${membro.ministerio === 'diaconia' ? 'selected' : ''}>Diaconia</option>
                        <option value="outros" ${membro.ministerio === 'outros' ? 'selected' : ''}>Outros</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="editObservacoes">Observações</label>
                    <textarea id="editObservacoes" name="observacoes" rows="3">${membro.observacoes || ''}</textarea>
                </div>

                <button type="button" class="btn btn-primary" onclick="igreja.salvarEdicao(${id})">
                    <i class="fas fa-save"></i> Salvar Alterações
                </button>
            `;

            modal.style.display = 'block';
        } catch (error) {
            this.mostrarMensagem(error.message || 'Erro ao carregar dados do membro', 'error');
        }
    }

    // Salvar edição
    async salvarEdicao(id) {
        const dadosAtualizados = {
            nome: document.getElementById('editNome').value,
            email: document.getElementById('editEmail').value,
            telefone: document.getElementById('editTelefone').value,
            data_nascimento: document.getElementById('editDataNascimento').value,
            data_batismo: document.getElementById('editDataBatismo').value,
            endereco: document.getElementById('editEndereco').value,
            cidade: document.getElementById('editCidade').value,
            tipo_membro: document.getElementById('editTipoMembro').value,
            ministerio: document.getElementById('editMinisterio').value,
            observacoes: document.getElementById('editObservacoes').value,
            ativo: true
        };

        try {
            const response = await this.fazerRequisicao(`/membros/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dadosAtualizados)
            });

            this.mostrarMensagem(response.message || 'Membro atualizado com sucesso!', 'success');
            this.fecharModal();
            this.atualizarDashboard();
            this.renderizarMembros();
        } catch (error) {
            this.mostrarMensagem(error.message || 'Erro ao atualizar membro', 'error');
        }
    }

    // Excluir membro
    async excluirMembro(id) {
        if (confirm('Tem certeza que deseja excluir este membro?')) {
            try {
                const response = await this.fazerRequisicao(`/membros/${id}`, {
                    method: 'DELETE'
                });

                this.mostrarMensagem(response.message || 'Membro excluído com sucesso!', 'success');
                this.atualizarDashboard();
                this.renderizarMembros();
            } catch (error) {
                this.mostrarMensagem(error.message || 'Erro ao excluir membro', 'error');
            }
        }
    }

    // Fechar modal (método legado - não usado mais)
    fecharModal() {
        // Modais são fechados via event delegation
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }

    // Mostrar modal de confirmação para exclusão
    mostrarModalConfirmacaoExclusao(membro) {
        const modal = document.createElement('div');
        modal.className = 'modal confirmation show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="confirmation-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="confirmation-title">Confirmar Exclusão</h3>
                <p class="confirmation-message">
                    Tem certeza que deseja excluir este membro?<br>
                    Esta ação não pode ser desfeita.
                </p>
                <div class="confirmation-member-name">
                    <i class="fas fa-user"></i> ${membro.nome}
                </div>
                <div class="confirmation-actions">
                    <button class="btn btn-cancel" data-action="cancel-delete">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn btn-confirm" data-action="confirm-delete" data-id="${membro.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners para os botões
        modal.querySelector('[data-action="cancel-delete"]').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('[data-action="confirm-delete"]').addEventListener('click', () => {
            modal.remove();
            this.confirmarExclusaoMembro(membro.id);
        });
        
        // Fechar modal ao clicar fora dele
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Confirmar exclusão do membro
    async confirmarExclusaoMembro(id) {
        try {
            console.log('🗑️ Confirmando exclusão do membro:', id);
            
            const response = await fetch(`${this.baseURL}/membros/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // Recarregar página com spinner (notificação será mostrada pela função)
                this.recarregarPaginaComSpinner('Removendo...', 'Atualizando lista de membros', true, 'Membro Removido!', 'Membro foi removido do sistema com sucesso!', true);
            } else {
                this.mostrarMensagem(data.error || 'Erro ao excluir membro', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir membro:', error);
            this.mostrarMensagem('Erro ao excluir membro', 'error');
        }
    }

    // Aniversários
    async filtrarAniversarios() {
        const mes = parseInt(document.getElementById('mesAniversario').value) + 1; // +1 porque JavaScript usa 0-11
        const container = document.getElementById('listaAniversarios');

        try {
            const response = await this.fazerRequisicao(`/aniversarios/mes/${mes}`);
            const aniversarios = response.data;

            if (aniversarios.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-birthday-cake"></i>
                        <h3>Nenhum aniversário neste mês</h3>
                    </div>
                `;
                return;
            }

            container.innerHTML = aniversarios.map(membro => {
                const dia = membro.dia_nascimento;
                const mesNome = this.obterNomeMes(parseInt(document.getElementById('mesAniversario').value));

                return `
                    <div class="birthday-item">
                        <div class="birthday-date">
                            <span class="day">${dia}</span>
                            <span class="month">${mesNome}</span>
                        </div>
                        <div class="birthday-info">
                            <h3>${membro.nome}</h3>
                            <p>${membro.ministerio ? this.formatarMinisterio(membro.ministerio) : 'Sem ministério'}</p>
                        </div>
                        <div class="birthday-actions">
                            ${membro.telefone ? `<button class="btn-whatsapp" data-action="birthday-whatsapp" data-phone="${membro.telefone}" data-name="${membro.nome}" data-id="${membro.id}" title="Enviar Parabéns">
                                <i class="fab fa-whatsapp"></i>
                            </button>` : ''}
                            ${membro.email ? `<button class="btn-email" data-action="birthday-email" data-email="${membro.email}" data-name="${membro.nome}" data-id="${membro.id}" title="Enviar Email">
                                <i class="fas fa-envelope"></i>
                            </button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar aniversários</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    configurarMesAtual() {
        const hoje = new Date();
        document.getElementById('mesAniversario').value = hoje.getMonth();
        this.filtrarAniversarios();
    }

    // WhatsApp e Email
    enviarWhatsApp(telefone, nome) {
        const mensagem = `Olá ${nome}! Paz do Senhor! Como está? Esperamos vê-lo(a) novamente em nossa igreja. Deus abençoe! 🙏`;
        const numeroLimpo = telefone.replace(/\D/g, '');
        const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    }

    async enviarParabensWhatsApp(telefone, nome, membroId) {
        const mensagem = `🎉🎂 Feliz Aniversário, ${nome}! 🎂🎉

Que o Senhor continue abençoando sua vida com muita saúde, paz e alegria!

"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais." - Jeremias 29:11

Parabéns da Comunidade Evangélica Príncipe da Paz! 🙏✨`;
        
        const numeroLimpo = telefone.replace(/\D/g, '');
        const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');

        // Log do envio
        try {
            await this.fazerRequisicao('/aniversarios/enviar-parabens', {
                method: 'POST',
                body: JSON.stringify({
                    membro_id: membroId,
                    tipo_envio: 'whatsapp',
                    sucesso: true
                })
            });
        } catch (error) {
            console.error('Erro ao registrar envio:', error);
        }
    }

    enviarEmail(email, nome) {
        const assunto = `Paz do Senhor, ${nome}!`;
        const corpo = `Olá ${nome}!

Paz do Senhor!

Esperamos vê-lo(a) novamente em nossa igreja. Que Deus continue abençoando sua vida!

Com carinho,
Comunidade Evangélica Príncipe da Paz - CEPPEMBU`;

        const url = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
        window.location.href = url;
    }

    async enviarParabensEmail(email, nome, membroId) {
        const assunto = `🎉 Feliz Aniversário, ${nome}! 🎂`;
        const corpo = `Querido(a) ${nome},

🎉🎂 Feliz Aniversário! 🎂🎉

Que o Senhor continue abençoando sua vida com muita saúde, paz e alegria!

"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais." - Jeremias 29:11

Que este novo ano de vida seja repleto das bênçãos do Senhor!

Com muito carinho e orações,
Comunidade Evangélica Príncipe da Paz - CEPPEMBU

🙏✨`;

        const url = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
        window.location.href = url;

        // Log do envio
        try {
            await this.fazerRequisicao('/aniversarios/enviar-parabens', {
                method: 'POST',
                body: JSON.stringify({
                    membro_id: membroId,
                    tipo_envio: 'email',
                    sucesso: true
                })
            });
        } catch (error) {
            console.error('Erro ao registrar envio:', error);
        }
    }

    async enviarWhatsAppAniversarios() {
        try {
            const response = await this.fazerRequisicao('/aniversarios/hoje');
            const aniversarios = response.data;
            
            if (aniversarios.length === 0) {
                this.mostrarMensagem('Não há aniversariantes hoje!', 'error');
                return;
            }

            if (confirm(`Enviar parabéns via WhatsApp para ${aniversarios.length} aniversariante(s)?`)) {
                aniversarios.forEach((membro, index) => {
                    if (membro.telefone) {
                        setTimeout(() => {
                            this.enviarParabensWhatsApp(membro.telefone, membro.nome, membro.id);
                        }, 1000 * index);
                    }
                });
            }
        } catch (error) {
            this.mostrarMensagem(error.message || 'Erro ao buscar aniversariantes', 'error');
        }
    }

    // Relatórios
    async gerarRelatorios() {
        try {
            console.log('📊 Iniciando relatórios...');
            await this.atualizarGraficos();
        } catch (error) {
            console.error('Erro ao gerar relatórios:', error);
            this.mostrarMensagem('Erro ao carregar relatórios: ' + error.message, 'error');
        }
    }

    async atualizarGraficos() {
        try {
            console.log('📊 Iniciando geração de relatórios modernos...');
            
            // Destruir gráficos existentes
            if (this.chartTipo) {
                this.chartTipo.destroy();
                this.chartTipo = null;
            }
            if (this.chartMinisterio) {
                this.chartMinisterio.destroy();
                this.chartMinisterio = null;
            }
            
            // Encontrar containers
            const containerTipo = document.getElementById('chartTipoContainer');
            const containerMinisterio = document.getElementById('chartMinisterioContainer');
            const loadingTipo = document.getElementById('chartTipoLoading');
            const loadingMinisterio = document.getElementById('chartMinisterioLoading');
            const canvasTipo = document.getElementById('chartTipo');
            const canvasMinisterio = document.getElementById('chartMinisterio');
            
            console.log('📊 Containers encontrados:', {
                tipo: !!containerTipo,
                ministerio: !!containerMinisterio,
                canvasTipo: !!canvasTipo,
                canvasMinisterio: !!canvasMinisterio
            });
            
            // Mostrar loading
            if (loadingTipo) loadingTipo.style.display = 'block';
            if (loadingMinisterio) loadingMinisterio.style.display = 'block';
            if (canvasTipo) canvasTipo.style.display = 'none';
            if (canvasMinisterio) canvasMinisterio.style.display = 'none';

            // Buscar dados de tipos - VERSÃO SIMPLIFICADA PARA DEBUG
            console.log('🔍 Buscando dados de tipos...');
            
            try {
                const tiposResponse = await fetch(`${this.baseURL}/relatorios/tipo-membro`);
                console.log('📊 Response status:', tiposResponse.status);
                
                const tiposData = await tiposResponse.json();
                console.log('📊 Dados de tipos recebidos:', tiposData);

                // Esconder loading primeiro
                if (loadingTipo) loadingTipo.style.display = 'none';
                
                // FORÇAR CRIAÇÃO DO CANVAS SE NÃO EXISTIR
                let canvasToUse = canvasTipo;
                if (!canvasToUse) {
                    console.log('📊 Canvas não encontrado na função principal, criando...');
                    if (containerTipo) {
                        containerTipo.innerHTML = '';
                        canvasToUse = document.createElement('canvas');
                        canvasToUse.id = 'chartTipo';
                        canvasToUse.style.width = '100%';
                        canvasToUse.style.height = '350px';
                        containerTipo.appendChild(canvasToUse);
                        console.log('📊 Canvas criado na função principal!');
                    }
                }
                
                if (canvasToUse) canvasToUse.style.display = 'block';

                if (tiposData.success && tiposData.data && tiposData.data.length > 0) {
                    const tipos = tiposData.data;
                    console.log('📊 Tipos processados:', tipos);
                    
                    // Dados simplificados para teste
                    const labels = tipos.map(t => this.formatarTipo(t.tipo_membro));
                    const data = tipos.map(t => parseInt(t.ativos));
                    const total = data.reduce((sum, val) => sum + val, 0);
                    
                    console.log('📊 Labels:', labels);
                    console.log('📊 Data:', data);
                    console.log('📊 Total:', total);
                    
                    // Atualizar estatísticas no header
                    const statsTipo = document.getElementById('tipoStats');
                    if (statsTipo) {
                        statsTipo.innerHTML = `<strong>${total}</strong> membros no total`;
                    }
                    
                    // Verificar se Chart.js está disponível
                    if (typeof Chart === 'undefined') {
                        console.error('❌ Chart.js não está carregado!');
                        if (containerTipo) {
                            containerTipo.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;"><h3>Chart.js não carregado!</h3></div>';
                        }
                        return;
                    }
                    
                    console.log('📊 Chart.js disponível, criando gráfico...');
                    
                    // Destruir gráfico existente
                    if (this.chartTipo) {
                        this.chartTipo.destroy();
                    }
                    
                    this.chartTipo = new Chart(canvasToUse, {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                backgroundColor: [
                                    'rgba(102, 126, 234, 0.8)',
                                    'rgba(240, 147, 251, 0.8)',
                                    'rgba(79, 172, 254, 0.8)',
                                    'rgba(255, 159, 64, 0.8)',
                                    'rgba(75, 192, 192, 0.8)'
                                ],
                                borderColor: [
                                    'rgba(102, 126, 234, 1)',
                                    'rgba(240, 147, 251, 1)',
                                    'rgba(79, 172, 254, 1)',
                                    'rgba(255, 159, 64, 1)',
                                    'rgba(75, 192, 192, 1)'
                                ],
                                borderWidth: 3,
                                hoverOffset: 15
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true,
                                        font: {
                                            size: 12,
                                            weight: 'bold'
                                        }
                                    }
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    titleColor: 'white',
                                    bodyColor: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    borderWidth: 1,
                                    cornerRadius: 8
                                }
                            },
                            animation: {
                                animateRotate: true,
                                animateScale: true,
                                duration: 2000,
                                easing: 'easeOutQuart'
                            }
                        }
                    });
                    
                    console.log('✅ Gráfico de pizza criado com sucesso!');
                    
                } else {
                    console.log('⚠️ Sem dados para tipos');
                    if (containerTipo) {
                        containerTipo.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><h3>Nenhum dado disponível</h3></div>';
                    }
                }
                
            } catch (error) {
                console.error('❌ Erro ao processar tipos:', error);
                if (loadingTipo) loadingTipo.style.display = 'none';
                if (containerTipo) {
                    containerTipo.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;"><h3>Erro: ${error.message}</h3></div>`;
                }
            }

            // Buscar dados de ministérios
            console.log('🔍 Buscando dados de ministérios...');
            const ministeriosResponse = await fetch(`${this.baseURL}/relatorios/ministerio`);
            const ministeriosData = await ministeriosResponse.json();
            console.log('📊 Dados de ministérios recebidos:', ministeriosData);

            if (ministeriosData.success && ministeriosData.data && ministeriosData.data.length > 0) {
                const ministerios = ministeriosData.data;
                const total = ministerios.reduce((sum, m) => sum + parseInt(m.ativos), 0);
                
                // Atualizar estatísticas no header
                const statsMinisterio = document.getElementById('ministerioStats');
                if (statsMinisterio) {
                    statsMinisterio.innerHTML = `<strong>${total}</strong> membros ativos em ministérios`;
                }
                
                // Criar gráfico de barras horizontal moderno
                if (loadingMinisterio) loadingMinisterio.style.display = 'none';
                if (canvasMinisterio) canvasMinisterio.style.display = 'block';
                
                this.chartMinisterio = new Chart(canvasMinisterio, {
                    type: 'bar',
                    data: {
                        labels: ministerios.map(m => m.ministerio),
                        datasets: [{
                            label: 'Membros Ativos',
                            data: ministerios.map(m => parseInt(m.ativos)),
                            backgroundColor: [
                                'rgba(102, 126, 234, 0.8)',
                                'rgba(240, 147, 251, 0.8)',
                                'rgba(79, 172, 254, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                                'rgba(255, 99, 132, 0.8)'
                            ],
                            borderColor: [
                                'rgba(102, 126, 234, 1)',
                                'rgba(240, 147, 251, 1)',
                                'rgba(79, 172, 254, 1)',
                                'rgba(255, 159, 64, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 99, 132, 1)'
                            ],
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: 'white',
                                bodyColor: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                borderWidth: 1,
                                cornerRadius: 8
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#666',
                                    font: {
                                        size: 11
                                    }
                                }
                            },
                            y: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: '#666',
                                    font: {
                                        size: 11,
                                        weight: 'bold'
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeOutQuart'
                        }
                    }
                });
                console.log('✅ Gráfico de barras criado');
            } else {
                console.log('⚠️ Sem dados para ministérios');
                if (loadingMinisterio) loadingMinisterio.style.display = 'none';
                if (containerMinisterio) {
                    containerMinisterio.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><h3>Nenhum dado disponível</h3></div>';
                }
            }
            
            console.log('📊 Relatórios modernos processados com sucesso');
            
        } catch (error) {
            console.error('Erro ao atualizar gráficos:', error);
            this.mostrarMensagem('Erro ao carregar relatórios: ' + error.message, 'error');
            
            // Esconder loading em caso de erro
            const loadingTipo = document.getElementById('chartTipoLoading');
            const loadingMinisterio = document.getElementById('chartMinisterioLoading');
            if (loadingTipo) loadingTipo.style.display = 'none';
            if (loadingMinisterio) loadingMinisterio.style.display = 'none';
        }
    }

    // Exportar dados
    async exportarDados() {
        try {
            const response = await fetch(`${this.baseURL}/relatorios/exportar`);
            
            if (!response.ok) {
                throw new Error('Erro ao exportar dados');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `membros_ceppembu_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.mostrarMensagem('Dados exportados com sucesso!', 'success');
        } catch (error) {
            this.mostrarMensagem(error.message || 'Erro ao exportar dados', 'error');
        }
    }

    // Ações dos botões de membros
    editarMembro(id) {
        console.log('✏️ Editando membro:', id);
        
        // Mostrar modal de carregamento primeiro
        this.abrirModalCarregamento();
        
        // Buscar dados do membro
        fetch(`${this.baseURL}/membros/${id}`)
            .then(response => {
                console.log('📊 Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('📊 Dados recebidos:', data);
                // Fechar modal de carregamento
                document.querySelector('.modal')?.remove();
                
                if (data.success && data.data) {
                    const membro = data.data;
                    this.abrirModalEdicao(membro);
                } else {
                    this.mostrarMensagem('Erro ao carregar dados do membro', 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar membro:', error);
                document.querySelector('.modal')?.remove();
                this.mostrarMensagem('Erro ao carregar membro', 'error');
            });
    }

    abrirModalCarregamento() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Carregando...</h3>
                    <button class="close-modal" data-close="modal">&times;</button>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <div class="loading"></div>
                    <p>Carregando dados do membro...</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    abrirModalEdicao(membro) {
        // Função para formatar data para input date (YYYY-MM-DD)
        const formatarDataParaInput = (data) => {
            if (!data) return '';
            const dataObj = new Date(data);
            return dataObj.toISOString().split('T')[0];
        };

        // Criar modal de edição
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Membro</h3>
                    <button class="close-modal" data-close="modal">&times;</button>
                </div>
                <form id="formEditarMembro">
                    <div class="form-group">
                        <label for="nomeEdit">Nome Completo</label>
                        <input type="text" id="nomeEdit" value="${membro.nome}" required>
                    </div>
                    <div class="form-group">
                        <label for="emailEdit">Email</label>
                        <input type="email" id="emailEdit" value="${membro.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="telefoneEdit">Telefone</label>
                        <input type="tel" id="telefoneEdit" value="${membro.telefone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="dataNascimentoEdit">Data de Nascimento</label>
                        <input type="date" id="dataNascimentoEdit" value="${formatarDataParaInput(membro.data_nascimento)}">
                    </div>
                    <div class="form-group">
                        <label for="dataBatismoEdit">Data de Batismo</label>
                        <input type="date" id="dataBatismoEdit" value="${formatarDataParaInput(membro.data_batismo)}">
                    </div>
                    <div class="form-group">
                        <label for="tipoMembroEdit">Tipo de Membro</label>
                        <select id="tipoMembroEdit" required>
                            <option value="membro" ${membro.tipo_membro === 'membro' ? 'selected' : ''}>Membro</option>
                            <option value="visitante" ${membro.tipo_membro === 'visitante' ? 'selected' : ''}>Visitante</option>
                            <option value="novo-convertido" ${membro.tipo_membro === 'novo-convertido' ? 'selected' : ''}>Novo Convertido</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ministerioEdit">Ministério</label>
                        <select id="ministerioEdit">
                            <option value="">Sem ministério</option>
                            <option value="pastor" ${membro.ministerio === 'pastor' ? 'selected' : ''}>Pastor</option>
                            <option value="louvor" ${membro.ministerio === 'louvor' ? 'selected' : ''}>Louvor</option>
                            <option value="infantil" ${membro.ministerio === 'infantil' ? 'selected' : ''}>Infantil</option>
                            <option value="jovens" ${membro.ministerio === 'jovens' ? 'selected' : ''}>Jovens</option>
                            <option value="senhores" ${membro.ministerio === 'senhores' ? 'selected' : ''}>Senhores</option>
                            <option value="senhoras" ${membro.ministerio === 'senhoras' ? 'selected' : ''}>Senhoras</option>
                            <option value="evangelismo" ${membro.ministerio === 'evangelismo' ? 'selected' : ''}>Evangelismo</option>
                            <option value="diaconia" ${membro.ministerio === 'diaconia' ? 'selected' : ''}>Diaconia</option>
                            <option value="outros" ${membro.ministerio === 'outros' ? 'selected' : ''}>Outros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="enderecoEdit">Endereço</label>
                        <input type="text" id="enderecoEdit" value="${membro.endereco || ''}">
                    </div>
                    <div class="form-group">
                        <label for="cidadeEdit">Cidade</label>
                        <input type="text" id="cidadeEdit" value="${membro.cidade || ''}">
                    </div>
                    <div class="form-group">
                        <label for="observacoesEdit">Observações</label>
                        <textarea id="observacoesEdit" rows="3">${membro.observacoes || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-close="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Armazenar dados originais do membro para referência
        this.membroEditando = membro;
        
        // Event listener para o formulário
        document.getElementById('formEditarMembro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarMembroEditado(membro.id);
        });
    }

    salvarMembroEditado(id) {
        // Buscar dados originais do membro para manter valores não alterados
        const membroOriginal = this.membroEditando;
        
        // Função para manter valor original se campo estiver vazio
        const manterValorOriginal = (valorAtual, valorOriginal) => {
            return valorAtual === '' ? valorOriginal : valorAtual;
        };
        
        const dados = {
            nome: document.getElementById('nomeEdit').value,
            email: manterValorOriginal(document.getElementById('emailEdit').value, membroOriginal.email),
            telefone: manterValorOriginal(document.getElementById('telefoneEdit').value, membroOriginal.telefone),
            data_nascimento: manterValorOriginal(document.getElementById('dataNascimentoEdit').value, membroOriginal.data_nascimento),
            data_batismo: manterValorOriginal(document.getElementById('dataBatismoEdit').value, membroOriginal.data_batismo),
            tipo_membro: document.getElementById('tipoMembroEdit').value,
            ministerio: manterValorOriginal(document.getElementById('ministerioEdit').value, membroOriginal.ministerio),
            endereco: manterValorOriginal(document.getElementById('enderecoEdit').value, membroOriginal.endereco),
            cidade: manterValorOriginal(document.getElementById('cidadeEdit').value, membroOriginal.cidade),
            observacoes: manterValorOriginal(document.getElementById('observacoesEdit').value, membroOriginal.observacoes),
            ativo: true // Sempre manter como ativo ao editar
        };

        console.log('📤 Enviando dados para API:', dados);

        fetch(`${this.baseURL}/membros/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
        .then(response => {
            console.log('📊 Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📊 Dados recebidos da API:', data);
            if (data.success) {
                document.querySelectorAll('.modal').forEach(modal => modal.remove());
                // Recarregar página com spinner (notificação será mostrada pela função)
                this.recarregarPaginaComSpinner('Atualizando...', 'Recarregando lista de membros', true, 'Membro Atualizado!', 'Informações do membro foram atualizadas com sucesso!', true);
            } else {
                this.mostrarMensagem(data.error || 'Erro ao atualizar membro', 'error');
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar membro:', error);
            this.mostrarMensagem('Erro ao atualizar membro', 'error');
        });
    }

    enviarWhatsApp(telefone, nome) {
        console.log('📱 Enviando WhatsApp para:', nome, telefone);
        const mensagem = `Olá ${nome}! Espero que esteja bem. Paz do Senhor! 🙏`;
        const url = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
        this.mostrarNotificacao('WhatsApp Aberto!', `Conversa iniciada com ${nome}`, 'success');
    }

    enviarEmail(email, nome) {
        console.log('📧 Enviando email para:', nome, email);
        const assunto = `Paz do Senhor, ${nome}!`;
        const corpo = `Olá ${nome}!\n\nEspero que esteja bem.\n\nQue a paz do Senhor esteja com você!\n\nAbraços,\nCEPPEMBU`;
        const url = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
        window.open(url);
        this.mostrarNotificacao('Email Aberto!', `Email de contato aberto para ${nome}`, 'success');
    }

    excluirMembro(id) {
        // Buscar dados do membro para mostrar no modal
        console.log('🔍 Buscando dados do membro para exclusão:', id);
        
        fetch(`${this.baseURL}/membros/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    // Mostrar modal de confirmação elegante
                    this.mostrarModalConfirmacaoExclusao(data.data);
                } else {
                    this.mostrarMensagem('Erro ao carregar dados do membro', 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar membro:', error);
                this.mostrarMensagem('Erro ao carregar dados do membro', 'error');
            });
    }

    // Ações dos botões de aniversários
    enviarParabensWhatsApp(telefone, nome, id) {
        console.log('🎉 Enviando parabéns via WhatsApp para:', nome);
        const mensagem = `🎉🎂 FELIZ ANIVERSÁRIO ${nome.toUpperCase()}! 🎂🎉\n\nQue este novo ano de vida seja abençoado pelo Senhor!\n\nQue Deus continue te abençoando cada dia mais!\n\nParabéns de toda a família CEPPEMBU! 🙏❤️`;
        const url = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
        this.mostrarNotificacao('Parabéns Enviados!', `Mensagem de aniversário enviada para ${nome}! 🎉`, 'success');
        
        // Log da atividade
        this.logarAtividade('whatsapp_parabens', `Parabéns enviados via WhatsApp para ${nome}`, id);
    }

    enviarParabensEmail(email, nome, id) {
        console.log('🎉 Enviando parabéns via email para:', nome);
        const assunto = `🎉 FELIZ ANIVERSÁRIO ${nome.toUpperCase()}! 🎉`;
        const corpo = `🎂🎉 FELIZ ANIVERSÁRIO ${nome.toUpperCase()}! 🎉🎂

Que este novo ano de vida seja repleto de bênçãos do Senhor!

Que Deus continue te abençoando, protegendo e guiando seus passos.

Que você seja muito feliz e abençoado!

Parabéns de toda a família CEPPEMBU!

Com carinho e orações,
Comunidade Evangélica Príncipe da Paz

"Em todo o tempo sejam benditas as suas entradas e as suas saídas." - Salmos 121:8 🙏❤️`;
        
        const url = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
        window.open(url);
        this.mostrarNotificacao('Parabéns Enviados!', `Email de aniversário enviado para ${nome}! 🎉`, 'success');
        
        // Log da atividade
        this.logarAtividade('email_parabens', `Parabéns enviados via email para ${nome}`, id);
    }

    logarAtividade(tipo, descricao, membro_id) {
        const dados = {
            tipo_atividade: tipo,
            descricao: descricao,
            membro_id: membro_id,
            data_atividade: new Date().toISOString()
        };

        fetch(`${this.baseURL}/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Atividade logada com sucesso');
            }
        })
        .catch(error => {
            console.error('Erro ao logar atividade:', error);
        });
    }

    // Utilitários
    formatarTipo(tipo) {
        const tipos = {
            'membro': 'Membro',
            'visitante': 'Visitante',
            'novo-convertido': 'Novo Convertido'
        };
        return tipos[tipo] || tipo;
    }

    formatarMinisterio(ministerio) {
        const ministerios = {
            'pastor': 'Pastor',
            'louvor': 'Louvor',
            'infantil': 'Infantil',
            'jovens': 'Jovens',
            'senhores': 'Senhores',
            'senhoras': 'Senhoras',
            'evangelismo': 'Evangelismo',
            'diaconia': 'Diaconia',
            'outros': 'Outros'
        };
        return ministerios[ministerio] || ministerio;
    }

    obterNomeMes(mes) {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return meses[mes];
    }

    // Sistema de Notificações Elegantes
    mostrarNotificacao(titulo, mensagem, tipo = 'info', duracao = 5000) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        // Criar elemento da notificação
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        
        // Definir ícones para cada tipo
        const icons = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info'
        };

        // Criar HTML da notificação
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[tipo] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${titulo}</div>
                <div class="notification-message">${mensagem}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="notification-progress" style="width: 100%;"></div>
        `;

        // Adicionar ao container
        container.appendChild(notification);

        // Animar entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Iniciar barra de progresso
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.transition = `width ${duracao}ms linear`;
        progressBar.style.width = '0%';

        // Auto-remover após duração
        setTimeout(() => {
            this.removerNotificacao(notification);
        }, duracao);

        // Pausar progresso ao hover
        notification.addEventListener('mouseenter', () => {
            progressBar.style.animationPlayState = 'paused';
        });

        notification.addEventListener('mouseleave', () => {
            progressBar.style.animationPlayState = 'running';
        });
    }

    // Remover notificação com animação
    removerNotificacao(notification) {
        if (!notification || !notification.parentElement) return;
        
        notification.classList.remove('show');
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 400);
    }

    // Mostrar mensagem (agora usa notificações elegantes)
    mostrarMensagem(mensagem, tipo = 'info') {
        const titulos = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };
        
        this.mostrarNotificacao(titulos[tipo] || 'Informação', mensagem, tipo);
    }

    // Mostrar notificação com barra de progresso melhorada
    mostrarNotificacaoComProgresso(titulo, mensagem, tipo = 'success', duracao = 2000) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        // Criar elemento da notificação
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        
        // Definir ícones para cada tipo
        const icons = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info'
        };

        // Criar HTML da notificação
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[tipo] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${titulo}</div>
                <div class="notification-message">${mensagem}</div>
            </div>
            <div class="notification-progress"></div>
        `;

        // Adicionar ao container
        container.appendChild(notification);

        // Animar entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Iniciar barra de progresso (da direita para a esquerda)
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.transition = `width ${duracao}ms linear`;
        progressBar.style.width = '100%'; // Começa com 100%
        
        // Animar para 0% (da direita para a esquerda)
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 100);

        // Auto-remover após duração
        setTimeout(() => {
            this.removerNotificacao(notification);
        }, duracao);
    }


    // Sistema de Carregamento da Página
    mostrarCarregamentoPagina(texto = 'Carregando...', subtitulo = 'Atualizando informações') {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (!overlay) return;

        // Atualizar textos
        const textoElement = overlay.querySelector('.page-loading-text');
        const subtituloElement = overlay.querySelector('.page-loading-subtitle');
        
        if (textoElement) textoElement.textContent = texto;
        if (subtituloElement) subtituloElement.textContent = subtitulo;

        // Mostrar overlay
        overlay.classList.add('show');
        
        // Prevenir scroll da página
        document.body.style.overflow = 'hidden';
    }

    esconderCarregamentoPagina() {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (!overlay) return;

        // Esconder overlay
        overlay.classList.remove('show');
        
        // Restaurar scroll da página
        document.body.style.overflow = '';
    }

    // Função para recarregar página com spinner
    recarregarPaginaComSpinner(texto = 'Atualizando...', subtitulo = 'Recarregando informações', mostrarNotificacao = true, tituloNotificacao = 'Sucesso!', mensagemNotificacao = 'Operação realizada com sucesso!', manterSecao = false) {
        // 1. Mostrar spinner primeiro
        this.mostrarCarregamentoPagina(texto, subtitulo);
        
        // 2. Esconder spinner após 1 segundo
        setTimeout(() => {
            this.esconderCarregamentoPagina();
            
            // 3. Mostrar notificação após spinner sumir
            if (mostrarNotificacao) {
                setTimeout(() => {
                    this.mostrarNotificacaoComProgresso(tituloNotificacao, mensagemNotificacao, 'success', 2000);
                }, 300);
            }
        }, 1000);
        
        // 4. Recarregar página APENAS após a barra de progresso terminar
        // Spinner (1000ms) + Pausa (300ms) + Notificação com barra (2000ms) + Margem (500ms)
        setTimeout(() => {
            if (manterSecao) {
                // Manter na mesma seção após recarregar
                const secaoAtual = document.querySelector('.section.active')?.id;
                if (secaoAtual) {
                    localStorage.setItem('ceppembu_secao_ativa', secaoAtual);
                }
            }
            window.location.reload();
        }, 3800); // Aumentado para 3.8 segundos
    }
}

// Navegação
function showSection(sectionId, clickedElement) {
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
        // Se não foi passado o elemento, encontrar pelo href
        const activeLink = document.querySelector(`a[href="#"][onclick*="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // Atualizar dados específicos da seção
    if (sectionId === 'relatorios') {
        console.log('📊 Navegando para relatórios, iniciando carregamento...');
        console.log('📊 Window.igreja existe?', !!window.igreja);
        
        // Teste direto
        const containerTipo = document.getElementById('chartTipoContainer');
        const containerMinisterio = document.getElementById('chartMinisterioContainer');
        console.log('📊 Containers diretos:', {
            tipo: !!containerTipo,
            ministerio: !!containerMinisterio
        });
        
        if (containerTipo) {
            containerTipo.innerHTML = '<div style="text-align: center; padding: 2rem; background: #f0f0f0;"><h3>Teste - Relatórios carregando...</h3></div>';
        }
        
        setTimeout(() => {
            if (window.igreja) {
                console.log('📊 Chamando gerarRelatorios...');
                window.igreja.gerarRelatorios();
            } else {
                console.error('❌ Igreja manager não encontrado');
            }
        }, 100);
    }
}

function fecharModal() {
    if (window.igreja) {
        window.igreja.fecharModal();
    } else {
        console.error('❌ Igreja manager não encontrado para fechar modal');
    }
}

// Inicializar aplicação
let igreja;
document.addEventListener('DOMContentLoaded', () => {
    // Esconder spinner de carregamento se estiver visível
    const overlay = document.getElementById('pageLoadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    igreja = new IgrejaManagerAPI();
    
    // Tornar igreja globalmente acessível
    window.igreja = igreja;
    
    console.log('✅ IgrejaManagerAPI inicializado e disponível globalmente');
    
    // Inicializar o sistema de roteamento
    window.router = new Router();
    
    // Verificar se há uma seção salva no localStorage
    const secaoSalva = localStorage.getItem('ceppembu_secao_ativa');
    if (secaoSalva) {
        // O router já vai lidar com a navegação baseada na URL
        localStorage.removeItem('ceppembu_secao_ativa'); // Limpar após usar
    }
    
    // Adicionar event listeners para navegação (usando o router)
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            console.log('🖱️ Link clicado:', sectionId, 'Router disponível:', !!window.router);
            if (sectionId && window.router) {
                // Usar o router para navegar (isso vai atualizar a URL)
                window.router.navigateTo(sectionId, link);
            }
        });
    });

    // Event listeners para botões
    document.getElementById('exportarDadosBtn')?.addEventListener('click', () => {
        igreja.exportarDados();
    });

    document.getElementById('filtrarAniversariosBtn')?.addEventListener('click', () => {
        igreja.filtrarAniversarios();
    });

    document.getElementById('enviarWhatsAppAniversariosBtn')?.addEventListener('click', () => {
        igreja.enviarWhatsAppAniversarios();
    });

    // Botão fecharModalBtn removido do HTML - modais fechados via event delegation

    // Event listeners para botões de membros e aniversários (delegation)
    document.addEventListener('click', (e) => {
        // Fechar modal
        if (e.target.closest('[data-close="modal"]')) {
            document.querySelectorAll('.modal').forEach(modal => modal.remove());
            return;
        }

        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        console.log('🔘 Botão clicado:', action);

        switch (action) {
            case 'edit':
                const editId = button.getAttribute('data-id');
                if (window.igreja) {
                    window.igreja.editarMembro(parseInt(editId));
                }
                break;

            case 'whatsapp':
                const whatsappPhone = button.getAttribute('data-phone');
                const whatsappName = button.getAttribute('data-name');
                if (window.igreja) {
                    window.igreja.enviarWhatsApp(whatsappPhone, whatsappName);
                }
                break;

            case 'email':
                const emailAddress = button.getAttribute('data-email');
                const emailName = button.getAttribute('data-name');
                if (window.igreja) {
                    window.igreja.enviarEmail(emailAddress, emailName);
                }
                break;

            case 'delete':
                const deleteId = button.getAttribute('data-id');
                if (window.igreja) {
                    window.igreja.excluirMembro(parseInt(deleteId));
                }
                break;

            case 'birthday-whatsapp':
                const bdayPhone = button.getAttribute('data-phone');
                const bdayName = button.getAttribute('data-name');
                const bdayId = button.getAttribute('data-id');
                if (window.igreja) {
                    window.igreja.enviarParabensWhatsApp(bdayPhone, bdayName, parseInt(bdayId));
                }
                break;

            case 'birthday-email':
                const bdayEmail = button.getAttribute('data-email');
                const bdayEmailName = button.getAttribute('data-name');
                const bdayEmailId = button.getAttribute('data-id');
                if (window.igreja) {
                    window.igreja.enviarParabensEmail(bdayEmail, bdayEmailName, parseInt(bdayEmailId));
                }
                break;
        }
    });

});

// Funções globais mantidas para compatibilidade (não usadas mais)
