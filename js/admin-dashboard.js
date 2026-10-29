(function () {
	var LABELS = { venda: 'Venda', aluguel: 'Aluguel', lancamento: 'Lançamento' };

	document.addEventListener('DOMContentLoaded', function () {
		if (!window.MastercasaAdminAuth) {
			return;
		}

		window.MastercasaAdminAuth.exigirCorretor(function (user, profile) {
			var nomeEl = document.getElementById('nomeUsuario');
			if (nomeEl) {
				nomeEl.textContent = profile.name || user.email;
			}
			carregarLista();
		});

		var sairBtn = document.getElementById('botaoSair');
		if (sairBtn) {
			sairBtn.addEventListener('click', function () {
				window.MastercasaAdminAuth.sair();
			});
		}
	});

	function carregarLista() {
		var corpo = document.getElementById('listaImoveis');
		var vazio = document.getElementById('listaVazia');
		if (!corpo) {
			return;
		}

		window.mastercasaDB
			.from('properties')
			.select('*')
			.order('created_at', { ascending: false })
			.then(function (resposta) {
				if (resposta.error) {
					alert('Erro ao carregar imóveis: ' + resposta.error.message);
					return;
				}

				var imoveis = resposta.data || [];
				corpo.innerHTML = '';
				if (vazio) {
					vazio.hidden = imoveis.length !== 0;
				}

				imoveis.forEach(function (imovel) {
					corpo.appendChild(criarLinha(imovel));
				});
			});
	}

	function criarLinha(imovel) {
		var linha = document.createElement('tr');

		var tdTitulo = document.createElement('td');
		tdTitulo.textContent = imovel.title;
		linha.appendChild(tdTitulo);

		var tdTipo = document.createElement('td');
		tdTipo.textContent = LABELS[imovel.transaction_type] || imovel.transaction_type;
		linha.appendChild(tdTipo);

		var tdLocal = document.createElement('td');
		tdLocal.textContent = imovel.location || '—';
		linha.appendChild(tdLocal);

		var tdPreco = document.createElement('td');
		tdPreco.textContent = imovel.price != null ? 'R$ ' + Number(imovel.price).toLocaleString('pt-BR') : '—';
		linha.appendChild(tdPreco);

		var tdAcoes = document.createElement('td');
		tdAcoes.className = 'admin-table-actions';

		var editar = document.createElement('a');
		editar.href = 'imovel-form.html?id=' + imovel.id;
		editar.className = 'btn btn-outline btn-small';
		editar.textContent = 'Editar';
		tdAcoes.appendChild(editar);

		var excluir = document.createElement('button');
		excluir.type = 'button';
		excluir.className = 'btn btn-outline btn-small';
		excluir.textContent = 'Excluir';
		excluir.addEventListener('click', function () {
			excluirImovel(imovel.id, imovel.title);
		});
		tdAcoes.appendChild(excluir);

		linha.appendChild(tdAcoes);
		return linha;
	}

	function excluirImovel(id, titulo) {
		if (!window.confirm('Remover o imóvel "' + titulo + '"? Essa ação não pode ser desfeita.')) {
			return;
		}

		window.mastercasaDB.from('properties').delete().eq('id', id).then(function (resposta) {
			if (resposta.error) {
				alert('Erro ao remover: ' + resposta.error.message);
				return;
			}
			carregarLista();
		});
	}
})();
