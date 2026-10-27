document.addEventListener('DOMContentLoaded', function () {
	var WHATSAPP_NUMBER = '5581999778291';

	// ---------- Mobile menu ----------
	var navToggle = document.getElementById('navToggle');
	var mainNav = document.getElementById('mainNav');
	var navToggleUse = navToggle ? navToggle.querySelector('use') : null;

	function setNavIcon(isOpen) {
		if (navToggleUse) {
			navToggleUse.setAttribute('href', isOpen ? '#icon-close' : '#icon-menu');
		}
	}

	if (navToggle && mainNav) {
		navToggle.addEventListener('click', function () {
			mainNav.classList.toggle('open');
			setNavIcon(mainNav.classList.contains('open'));
		});

		mainNav.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', function () {
				mainNav.classList.remove('open');
				setNavIcon(false);
			});
		});
	}

	// ---------- Filtro de imóveis ----------
	var filtroLocalizacao = document.getElementById('filtroLocalizacao');
	var limparFiltros = document.getElementById('limparFiltros');
	var propertyCards = document.querySelectorAll('.property-card');
	var noResults = document.getElementById('noResults');

	var faixaAtual = {
		valorMin: 0,
		valorMax: 1000000,
		tamanhoMin: 0,
		tamanhoMax: 200
	};

	function clamp(valor, min, max) {
		return Math.min(Math.max(valor, min), max);
	}

	function aplicarFiltros() {
		var localizacao = filtroLocalizacao ? filtroLocalizacao.value : '';
		var visiveis = 0;

		propertyCards.forEach(function (card) {
			var preco = parseFloat(card.getAttribute('data-price'));
			var tamanho = parseFloat(card.getAttribute('data-size'));
			var combina =
				preco >= faixaAtual.valorMin && preco <= faixaAtual.valorMax &&
				tamanho >= faixaAtual.tamanhoMin && tamanho <= faixaAtual.tamanhoMax &&
				(!localizacao || card.getAttribute('data-location') === localizacao);

			card.hidden = !combina;
			if (combina) {
				visiveis++;
			}
		});

		if (noResults) {
			noResults.hidden = visiveis !== 0;
		}
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

	var filtroValorSlider = criarFiltroIntervalo({
		minRangeId: 'valorMinRange',
		maxRangeId: 'valorMaxRange',
		minInputId: 'valorMinInput',
		maxInputId: 'valorMaxInput',
		fillId: 'valorFill',
		onChange: function (min, max) {
			faixaAtual.valorMin = min;
			faixaAtual.valorMax = max;
			aplicarFiltros();
		}
	});

	var filtroTamanhoSlider = criarFiltroIntervalo({
		minRangeId: 'tamanhoMinRange',
		maxRangeId: 'tamanhoMaxRange',
		minInputId: 'tamanhoMinInput',
		maxInputId: 'tamanhoMaxInput',
		fillId: 'tamanhoFill',
		onChange: function (min, max) {
			faixaAtual.tamanhoMin = min;
			faixaAtual.tamanhoMax = max;
			aplicarFiltros();
		}
	});

	if (filtroLocalizacao) {
		filtroLocalizacao.addEventListener('change', aplicarFiltros);
	}

	if (limparFiltros) {
		limparFiltros.addEventListener('click', function () {
			if (filtroValorSlider) {
				filtroValorSlider.resetar();
			}
			if (filtroTamanhoSlider) {
				filtroTamanhoSlider.resetar();
			}
			if (filtroLocalizacao) {
				filtroLocalizacao.value = '';
			}
			aplicarFiltros();
		});
	}

	aplicarFiltros();

	// ---------- Busca -> WhatsApp ----------
	var formBusca = document.getElementById('formBusca');

	if (formBusca) {
		formBusca.addEventListener('submit', function (event) {
			event.preventDefault();

			var pretensao = document.getElementById('pretensao').value;
			var tipoImovel = document.getElementById('tipoImovel').value;
			var regiao = document.getElementById('regiao').value.trim();
			var faixaValor = document.getElementById('faixaValor').value;
			var quartos = document.getElementById('quartos').value;
			var tamanho = document.getElementById('tamanho').value;

			var partes = [
				'Olá! Vim pelo site da Mastercasa.',
				'Quero: ' + pretensao + '.',
				'Tipo de imóvel: ' + tipoImovel + '.'
			];

			if (regiao) {
				partes.push('Bairro/região: ' + regiao + '.');
			}

			if (faixaValor) {
				partes.push('Faixa de valor: ' + faixaValor + '.');
			}

			if (quartos) {
				partes.push('Quartos: ' + quartos + '.');
			}

			if (tamanho) {
				partes.push('Tamanho: ' + tamanho + '.');
			}

			var mensagem = encodeURIComponent(partes.join(' '));
			var url = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + mensagem;

			window.open(url, '_blank', 'noopener');
		});
	}

	// ---------- Cookie bar ----------
	var cookieBar = document.getElementById('cookieBar');
	var cookieAccept = document.getElementById('cookieAccept');
	var COOKIE_KEY = 'mastercasa_cookies_accepted';

	if (cookieBar && cookieAccept) {
		try {
			if (!localStorage.getItem(COOKIE_KEY)) {
				setTimeout(function () {
					cookieBar.classList.add('visible');
				}, 800);
			}
		} catch (e) {
			cookieBar.classList.add('visible');
		}

		cookieAccept.addEventListener('click', function () {
			cookieBar.classList.remove('visible');
			try {
				localStorage.setItem(COOKIE_KEY, '1');
			} catch (e) {
				/* localStorage indisponível — apenas esconde a barra */
			}
		});
	}

	// ---------- Ano no rodapé ----------
	var yearEl = document.getElementById('year');
	if (yearEl) {
		yearEl.textContent = new Date().getFullYear();
	}
});
