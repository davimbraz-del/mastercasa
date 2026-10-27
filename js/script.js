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

	// ---------- Abas de imóveis em destaque ----------
	var tabButtons = document.querySelectorAll('.tab-btn');
	var tabPanels = document.querySelectorAll('.tab-panel');

	tabButtons.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var target = btn.getAttribute('data-tab');

			tabButtons.forEach(function (b) {
				b.classList.remove('is-active');
				b.setAttribute('aria-selected', 'false');
			});
			tabPanels.forEach(function (p) {
				p.classList.remove('is-active');
				p.hidden = true;
			});

			btn.classList.add('is-active');
			btn.setAttribute('aria-selected', 'true');

			var panel = document.querySelector('.tab-panel[data-panel="' + target + '"]');
			if (panel) {
				panel.classList.add('is-active');
				panel.hidden = false;
			}
		});
	});

	// ---------- Busca -> WhatsApp ----------
	var formBusca = document.getElementById('formBusca');

	if (formBusca) {
		formBusca.addEventListener('submit', function (event) {
			event.preventDefault();

			var pretensao = document.getElementById('pretensao').value;
			var tipoImovel = document.getElementById('tipoImovel').value;
			var regiao = document.getElementById('regiao').value.trim();
			var faixaValor = document.getElementById('faixaValor').value;

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
