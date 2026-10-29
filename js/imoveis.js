// Lista os imóveis na página pública: busca no Supabase (quando configurado),
// aplica os filtros de faixa de valor/tamanho/localização e controla o
// botão de favoritar (que exige login na área do cliente).
(function () {
	var WHATSAPP_NUMBER = '5581999778291';

	var TRANSACTION_LABELS = { venda: 'Venda', aluguel: 'Aluguel', lancamento: 'Lançamento' };
	var TRANSACTION_BADGE_CLASS = { venda: '', aluguel: 'property-badge-alt', lancamento: 'property-badge-launch' };
	var TRANSACTION_ICON = { venda: 'icon-building', aluguel: 'icon-key', lancamento: 'icon-rocket' };

	// Usados enquanto o Supabase não está configurado (ou ainda sem imóveis cadastrados).
	var EXEMPLOS = [
		{ id: 'exemplo-1', title: 'Apartamento no Espinheiro', transaction_type: 'venda', property_type: 'Apartamento', price: 550000, size: 90, bedrooms: 3, parking: 2, location: 'Espinheiro', photo_url: null, isExample: true },
		{ id: 'exemplo-2', title: 'Casa em Casa Forte', transaction_type: 'venda', property_type: 'Casa', price: 850000, size: 180, bedrooms: 4, parking: 3, location: 'Casa Forte', photo_url: null, isExample: true },
		{ id: 'exemplo-3', title: 'Apartamento em Boa Viagem', transaction_type: 'venda', property_type: 'Apartamento', price: 320000, size: 68, bedrooms: 2, parking: 1, location: 'Boa Viagem', photo_url: null, isExample: true },
		{ id: 'exemplo-4', title: 'Apartamento no Espinheiro', transaction_type: 'aluguel', property_type: 'Apartamento', price: 150000, size: 72, bedrooms: 2, parking: 1, location: 'Espinheiro', photo_url: null, isExample: true },
		{ id: 'exemplo-5', title: 'Sala comercial no Espinheiro', transaction_type: 'aluguel', property_type: 'Sala comercial', price: 90000, size: 40, bedrooms: null, parking: 1, location: 'Espinheiro', photo_url: null, isExample: true },
		{ id: 'exemplo-6', title: 'Casa em Boa Viagem', transaction_type: 'aluguel', property_type: 'Casa', price: 480000, size: 140, bedrooms: 3, parking: 2, location: 'Boa Viagem', photo_url: null, isExample: true },
		{ id: 'exemplo-7', title: 'Residencial na planta — Espinheiro', transaction_type: 'lancamento', property_type: 'Apartamento', price: 320000, size: 70, bedrooms: null, parking: null, location: 'Espinheiro', meta_text: '2 e 3 quartos · Entrega prevista', photo_url: null, isExample: true },
		{ id: 'exemplo-8', title: 'Residencial na planta — Casa Forte', transaction_type: 'lancamento', property_type: 'Apartamento', price: 550000, size: 110, bedrooms: null, parking: null, location: 'Casa Forte', meta_text: '3 e 4 quartos · Entrega prevista', photo_url: null, isExample: true }
	];

	var state = {
		properties: [],
		favoriteIds: {},
		usuarioLogado: null,
		sliders: {},
		filtros: { valorMin: 0, valorMax: 1000000, tamanhoMin: 0, tamanhoMax: 200, localizacao: '' }
	};

	var els = {};

	document.addEventListener('DOMContentLoaded', init);

	function init() {
		els.grid = document.getElementById('propertyGrid');
		if (!els.grid) {
			return;
		}

		els.loading = document.getElementById('loadingImoveis');
		els.noResults = document.getElementById('noResults');
		els.filtroLocalizacao = document.getElementById('filtroLocalizacao');
		els.limparFiltros = document.getElementById('limparFiltros');

		configurarSliders();

		if (els.filtroLocalizacao) {
			els.filtroLocalizacao.addEventListener('change', function () {
				state.filtros.localizacao = els.filtroLocalizacao.value;
				renderizar();
			});
		}

		if (els.limparFiltros) {
			els.limparFiltros.addEventListener('click', limparTudo);
		}

		carregarUsuarioEFavoritos().then(carregarImoveis);
	}

	function carregarUsuarioEFavoritos() {
		if (!window.mastercasaDB) {
			return Promise.resolve();
		}

		return window.mastercasaDB.auth.getSession()
			.then(function (resultado) {
				var sessao = resultado && resultado.data && resultado.data.session;
				state.usuarioLogado = sessao ? sessao.user : null;

				if (!state.usuarioLogado) {
					return;
				}

				return window.mastercasaDB
					.from('favorites')
					.select('property_id')
					.then(function (resposta) {
						(resposta.data || []).forEach(function (linha) {
							state.favoriteIds[linha.property_id] = true;
						});
					});
			})
			.catch(function (erro) {
				console.warn('Não foi possível carregar os favoritos.', erro);
			});
	}

	function carregarImoveis() {
		if (window.mastercasaDB && window.MASTERCASA_SUPABASE_CONFIGURADO) {
			window.mastercasaDB
				.from('properties')
				.select('*')
				.order('created_at', { ascending: false })
				.then(function (resposta) {
					if (resposta.error || !resposta.data || resposta.data.length === 0) {
						if (resposta.error) {
							console.warn('Erro ao buscar imóveis no Supabase, exibindo exemplos.', resposta.error);
						}
						usarExemplos();
						return;
					}
					state.properties = resposta.data;
					finalizarCarregamento();
				})
				.catch(function (erro) {
					console.warn('Erro ao buscar imóveis, exibindo exemplos.', erro);
					usarExemplos();
				});
		} else {
			usarExemplos();
		}
	}

	function usarExemplos() {
		state.properties = EXEMPLOS;
		finalizarCarregamento();
	}

	function finalizarCarregamento() {
		if (els.loading) {
			els.loading.hidden = true;
		}
		renderizar();
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
		return partes.join(' · ');
	}

	function criarCard(property) {
		var label = TRANSACTION_LABELS[property.transaction_type] || 'Imóvel';
		var badgeClass = TRANSACTION_BADGE_CLASS[property.transaction_type] || '';
		var iconId = TRANSACTION_ICON[property.transaction_type] || 'icon-building';

		var card = document.createElement('article');
		card.className = 'property-card';
		card.setAttribute('data-price', property.price != null ? property.price : '0');
		card.setAttribute('data-size', property.size != null ? property.size : '0');
		card.setAttribute('data-location', property.location || '');

		var thumb = document.createElement('div');
		thumb.className = 'property-thumb';

		if (property.photo_url) {
			var img = document.createElement('img');
			img.className = 'property-photo';
			img.src = property.photo_url;
			img.alt = property.title || '';
			thumb.appendChild(img);
		} else {
			thumb.innerHTML = '<svg class="icon"><use href="#' + iconId + '"></use></svg>';
		}

		var badge = document.createElement('span');
		badge.className = 'property-badge' + (badgeClass ? ' ' + badgeClass : '');
		badge.textContent = label;
		thumb.appendChild(badge);

		if (!property.isExample) {
			var favoritado = !!state.favoriteIds[property.id];
			var favBtn = document.createElement('button');
			favBtn.type = 'button';
			favBtn.className = 'favorite-btn' + (favoritado ? ' is-active' : '');
			favBtn.setAttribute('aria-label', 'Favoritar imóvel');
			favBtn.setAttribute('aria-pressed', favoritado ? 'true' : 'false');
			favBtn.innerHTML = '<svg class="icon"><use href="#icon-heart"></use></svg>';
			favBtn.addEventListener('click', function () {
				alternarFavorito(property.id, favBtn);
			});
			thumb.appendChild(favBtn);
		}

		var body = document.createElement('div');
		body.className = 'property-body';

		var h3 = document.createElement('h3');
		h3.textContent = property.title;
		body.appendChild(h3);

		var meta = montarMeta(property);
		if (meta) {
			var metaEl = document.createElement('p');
			metaEl.className = 'property-meta';
			metaEl.textContent = meta;
			body.appendChild(metaEl);
		}

		var priceEl = document.createElement('p');
		priceEl.className = 'property-price';
		priceEl.textContent = formatarPreco(property);
		body.appendChild(priceEl);

		var link = document.createElement('a');
		link.className = 'btn btn-outline btn-block';
		link.target = '_blank';
		link.rel = 'noopener';
		var mensagem = 'Olá! Tenho interesse no imóvel: ' + property.title + ' (' + label + ').';
		link.href = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(mensagem);
		link.textContent = 'Tenho interesse';
		body.appendChild(link);

		card.appendChild(thumb);
		card.appendChild(body);
		return card;
	}

	function alternarFavorito(propertyId, btn) {
		if (!window.mastercasaDB) {
			return;
		}

		if (!state.usuarioLogado) {
			window.location.href = 'cliente/login.html';
			return;
		}

		var jaFavoritado = !!state.favoriteIds[propertyId];
		var acao = jaFavoritado
			? window.mastercasaDB.from('favorites').delete().eq('user_id', state.usuarioLogado.id).eq('property_id', propertyId)
			: window.mastercasaDB.from('favorites').insert({ user_id: state.usuarioLogado.id, property_id: propertyId });

		acao.then(function (resposta) {
			if (resposta.error) {
				console.warn('Não foi possível atualizar o favorito.', resposta.error);
				return;
			}
			state.favoriteIds[propertyId] = !jaFavoritado;
			btn.classList.toggle('is-active', !jaFavoritado);
			btn.setAttribute('aria-pressed', !jaFavoritado ? 'true' : 'false');
		});
	}

	function renderizar() {
		els.grid.innerHTML = '';
		var visiveis = 0;

		state.properties.forEach(function (property) {
			var preco = property.price != null ? Number(property.price) : 0;
			var tamanho = property.size != null ? Number(property.size) : 0;
			var combina =
				preco >= state.filtros.valorMin && preco <= state.filtros.valorMax &&
				tamanho >= state.filtros.tamanhoMin && tamanho <= state.filtros.tamanhoMax &&
				(!state.filtros.localizacao || property.location === state.filtros.localizacao);

			if (!combina) {
				return;
			}

			visiveis++;
			els.grid.appendChild(criarCard(property));
		});

		if (els.noResults) {
			els.noResults.hidden = visiveis !== 0;
		}
	}

	function clamp(valor, min, max) {
		return Math.min(Math.max(valor, min), max);
	}

	// Slider de intervalo (dois controles sobrepostos + campos numéricos)
	function criarFiltroIntervalo(opcoes) {
		var minRange = document.getElementById(opcoes.minRangeId);
		var maxRange = document.getElementById(opcoes.maxRangeId);
		var minInput = document.getElementById(opcoes.minInputId);
		var maxInput = document.getElementById(opcoes.maxInputId);
		var fill = document.getElementById(opcoes.fillId);

		if (!minRange || !maxRange || !minInput || !maxInput || !fill) {
			return null;
		}

		var limiteMin = parseFloat(minRange.min);
		var limiteMax = parseFloat(minRange.max);

		function atualizarFill() {
			var minVal = parseFloat(minRange.value);
			var maxVal = parseFloat(maxRange.value);
			var minPct = ((minVal - limiteMin) / (limiteMax - limiteMin)) * 100;
			var maxPct = ((maxVal - limiteMin) / (limiteMax - limiteMin)) * 100;
			fill.style.left = minPct + '%';
			fill.style.width = (maxPct - minPct) + '%';
		}

		function doRange() {
			var minVal = parseFloat(minRange.value);
			var maxVal = parseFloat(maxRange.value);
			if (minVal > maxVal) {
				minVal = maxVal;
				minRange.value = minVal;
			}
			minInput.value = minVal;
			maxInput.value = maxVal;
			atualizarFill();
			opcoes.onChange(minVal, maxVal);
		}

		function doInput() {
			var minVal = clamp(parseFloat(minInput.value) || limiteMin, limiteMin, limiteMax);
			var maxVal = clamp(parseFloat(maxInput.value) || limiteMax, limiteMin, limiteMax);
			if (minVal > maxVal) {
				maxVal = minVal;
			}
			minInput.value = minVal;
			maxInput.value = maxVal;
			minRange.value = minVal;
			maxRange.value = maxVal;
			atualizarFill();
			opcoes.onChange(minVal, maxVal);
		}

		minRange.addEventListener('input', doRange);
		maxRange.addEventListener('input', doRange);
		minInput.addEventListener('change', doInput);
		maxInput.addEventListener('change', doInput);

		atualizarFill();

		return {
			resetar: function () {
				minRange.value = limiteMin;
				maxRange.value = limiteMax;
				minInput.value = limiteMin;
				maxInput.value = limiteMax;
				atualizarFill();
				opcoes.onChange(limiteMin, limiteMax);
			}
		};
	}

	function configurarSliders() {
		state.sliders.valor = criarFiltroIntervalo({
			minRangeId: 'valorMinRange',
			maxRangeId: 'valorMaxRange',
			minInputId: 'valorMinInput',
			maxInputId: 'valorMaxInput',
			fillId: 'valorFill',
			onChange: function (min, max) {
				state.filtros.valorMin = min;
				state.filtros.valorMax = max;
				renderizar();
			}
		});

		state.sliders.tamanho = criarFiltroIntervalo({
			minRangeId: 'tamanhoMinRange',
			maxRangeId: 'tamanhoMaxRange',
			minInputId: 'tamanhoMinInput',
			maxInputId: 'tamanhoMaxInput',
			fillId: 'tamanhoFill',
			onChange: function (min, max) {
				state.filtros.tamanhoMin = min;
				state.filtros.tamanhoMax = max;
				renderizar();
			}
		});
	}

	function limparTudo() {
		if (state.sliders.valor) {
			state.sliders.valor.resetar();
		}
		if (state.sliders.tamanho) {
			state.sliders.tamanho.resetar();
		}
		if (els.filtroLocalizacao) {
			els.filtroLocalizacao.value = '';
		}
		state.filtros.localizacao = '';
		renderizar();
	}
})();
