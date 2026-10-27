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
	var filtroValor = document.getElementById('filtroValor');
	var filtroTamanho = document.getElementById('filtroTamanho');
	var filtroLocalizacao = document.getElementById('filtroLocalizacao');
	var limparFiltros = document.getElementById('limparFiltros');
	var propertyCards = document.querySelectorAll('.property-card');
	var noResults = document.getElementById('noResults');

	function aplicarFiltros() {
		var valor = filtroValor.value;
		var tamanho = filtroTamanho.value;
		var localizacao = filtroLocalizacao.value;
		var visiveis = 0;

		propertyCards.forEach(function (card) {
			var combina =
				(!valor || card.getAttribute('data-price') === valor) &&
				(!tamanho || card.getAttribute('data-size') === tamanho) &&
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

	if (filtroValor && filtroTamanho && filtroLocalizacao) {
		[filtroValor, filtroTamanho, filtroLocalizacao].forEach(function (select) {
			select.addEventListener('change', aplicarFiltros);
		});
	}

	if (limparFiltros) {
		limparFiltros.addEventListener('click', function () {
			filtroValor.value = '';
			filtroTamanho.value = '';
			filtroLocalizacao.value = '';
			aplicarFiltros();
		});
	}

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
