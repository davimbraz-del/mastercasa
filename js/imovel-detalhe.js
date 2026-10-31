(function () {
	var WHATSAPP_NUMBER = '5581999778291';
	var TRANSACTION_LABELS = { venda: 'Venda', aluguel: 'Aluguel', lancamento: 'Lançamento' };
	var TRANSACTION_BADGE_CLASS = { venda: '', aluguel: 'property-badge-alt', lancamento: 'property-badge-launch' };

	var state = {
		property: null,
		fotos: [],
		indiceAtual: 0,
		usuarioLogado: null,
		favoritado: false
	};

	document.addEventListener('DOMContentLoaded', init);

	function paramId() {
		var params = new URLSearchParams(window.location.search);
		return params.get('id');
	}

	function init() {
		var id = paramId();
		var carregando = document.getElementById('detalheCarregando');
		var naoEncontrado = document.getElementById('detalheNaoEncontrado');

		if (!document.getElementById('detalheConteudo')) {
			return;
		}

		if (!id || !window.mastercasaDB) {
			if (carregando) {
				carregando.hidden = true;
			}
			if (naoEncontrado) {
				naoEncontrado.hidden = false;
			}
			return;
		}

		carregarSessao().then(function () {
			window.mastercasaDB.from('properties').select('*').eq('id', id).single().then(function (resposta) {
				if (carregando) {
					carregando.hidden = true;
				}

				if (resposta.error || !resposta.data) {
					if (naoEncontrado) {
						naoEncontrado.hidden = false;
					}
					return;
				}

				state.property = resposta.data;
				carregarFavorito(id).then(renderizar);
			});
		});
	}

	function carregarSessao() {
		return window.mastercasaDB.auth.getSession().then(function (resultado) {
			var sessao = resultado && resultado.data && resultado.data.session;
			state.usuarioLogado = sessao ? sessao.user : null;
		});
	}

	function carregarFavorito(propertyId) {
		if (!state.usuarioLogado) {
			return Promise.resolve();
		}
		return window.mastercasaDB
			.from('favorites')
			.select('id')
			.eq('property_id', propertyId)
			.then(function (resposta) {
				state.favoritado = !!(resposta.data && resposta.data.length);
			});
	}

	function formatarPreco(property) {
		if (property.transaction_type === 'lancamento') {
			return 'Condições especiais de pagamento';
		}
		if (property.price === null || property.price === undefined || isNaN(property.price)) {
			return 'Valor sob consulta';
		}
		return 'R$ ' + Number(property.price).toLocaleString('pt-BR');
	}

	function montarMeta(property) {
		if (property.meta_text) {
			return property.meta_text;
		}
		var partes = [];
		if (property.bedrooms) {
			partes.push(property.bedrooms + (property.bedrooms === 1 ? ' quarto' : ' quartos'));
		} else if (property.property_type) {
			partes.push(property.property_type);
		}
		if (property.parking) {
			partes.push(property.parking + (property.parking === 1 ? ' vaga' : ' vagas'));
		}
		if (property.size) {
			partes.push(property.size + ' m²');
		}
		if (property.location) {
			partes.push(property.location);
		}
		return partes.join(' · ');
	}

	function obterFotos(property) {
		if (property.photos && property.photos.length) {
			return property.photos;
		}
		if (property.photo_url) {
			return [property.photo_url];
		}
		return [];
	}

	function renderizar() {
		var property = state.property;
		state.fotos = obterFotos(property);

		var label = TRANSACTION_LABELS[property.transaction_type] || 'Imóvel';
		var badgeClass = TRANSACTION_BADGE_CLASS[property.transaction_type] || '';

		document.title = property.title + ' - Mastercasa Imobiliária';

		var badgeEl = document.getElementById('detalheBadge');
		badgeEl.textContent = label;
		badgeEl.className = 'property-badge-static' + (badgeClass ? ' ' + badgeClass : '');

		document.getElementById('detalheTitulo').textContent = property.title;
		document.getElementById('detalheMeta').textContent = montarMeta(property);
		document.getElementById('detalhePreco').textContent = formatarPreco(property);
		document.getElementById('detalheDescricao').textContent =
			property.description || 'Entre em contato com a gente para saber mais detalhes sobre este imóvel.';

		var mensagem = 'Olá! Tenho interesse no imóvel: ' + property.title + ' (' + label + ').';
		document.getElementById('detalheWhatsapp').href =
			'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(mensagem);

		renderizarGaleria();
		renderizarFavorito();
		renderizarMapa();

		document.getElementById('detalheConteudo').hidden = false;
	}

	function renderizarGaleria() {
		var principal = document.getElementById('detalheFotoPrincipal');
		var thumbsWrap = document.getElementById('detalheThumbs');
		var prevBtn = document.getElementById('detalhePrev');
		var nextBtn = document.getElementById('detalheNext');

		thumbsWrap.innerHTML = '';

		if (!state.fotos.length) {
			principal.hidden = true;
			prevBtn.hidden = true;
			nextBtn.hidden = true;
			return;
		}

		principal.hidden = false;
		principal.src = state.fotos[0];
		principal.alt = state.property.title || '';

		var temVarias = state.fotos.length > 1;
		prevBtn.hidden = !temVarias;
		nextBtn.hidden = !temVarias;

		state.fotos.forEach(function (url, indice) {
			var thumb = document.createElement('img');
			thumb.src = url;
			thumb.alt = 'Foto ' + (indice + 1);
			thumb.className = indice === 0 ? 'is-active' : '';
			thumb.addEventListener('click', function () {
				state.indiceAtual = indice;
				atualizarFotoPrincipal();
			});
			thumbsWrap.appendChild(thumb);
		});

		prevBtn.onclick = function () {
			state.indiceAtual = (state.indiceAtual - 1 + state.fotos.length) % state.fotos.length;
			atualizarFotoPrincipal();
		};
		nextBtn.onclick = function () {
			state.indiceAtual = (state.indiceAtual + 1) % state.fotos.length;
			atualizarFotoPrincipal();
		};
	}

	function atualizarFotoPrincipal() {
		document.getElementById('detalheFotoPrincipal').src = state.fotos[state.indiceAtual];
		var thumbs = document.querySelectorAll('#detalheThumbs img');
		thumbs.forEach(function (thumb, indice) {
			thumb.classList.toggle('is-active', indice === state.indiceAtual);
		});
	}

	function renderizarFavorito() {
		var btn = document.getElementById('detalheFavorito');
		if (!btn) {
			return;
		}

		atualizarBotaoFavorito(btn);

		btn.addEventListener('click', function () {
			if (!window.mastercasaDB) {
				return;
			}

			if (!state.usuarioLogado) {
				window.location.href = 'cliente/login.html';
				return;
			}

			var acao = state.favoritado
				? window.mastercasaDB.from('favorites').delete().eq('user_id', state.usuarioLogado.id).eq('property_id', state.property.id)
				: window.mastercasaDB.from('favorites').insert({ user_id: state.usuarioLogado.id, property_id: state.property.id });

			acao.then(function (resposta) {
				if (resposta.error) {
					alert('Não foi possível atualizar o favorito.');
					return;
				}
				state.favoritado = !state.favoritado;
				atualizarBotaoFavorito(btn);
			});
		});
	}

	function atualizarBotaoFavorito(btn) {
		btn.classList.toggle('is-active', state.favoritado);
		btn.innerHTML = '<svg class="icon"><use href="#icon-heart"></use></svg> ' + (state.favoritado ? 'Favoritado' : 'Favoritar');
	}

	function renderizarMapa() {
		var wrap = document.getElementById('detalheMapaWrap');
		var iframe = document.getElementById('detalheMapa');
		if (!wrap || !iframe || !state.property.location) {
			return;
		}
		var consulta = encodeURIComponent(state.property.location + ', Recife - PE');
		iframe.src = 'https://www.google.com/maps?q=' + consulta + '&output=embed';
		wrap.hidden = false;
	}
})();
