// Carrega o Google Analytics (GA4) apenas quando js/analytics-config.js
// já tiver um Measurement ID de verdade, e registra automaticamente um
// evento sempre que alguém clica num link do WhatsApp no site.
(function () {
	var id = window.GA_MEASUREMENT_ID;
	var configurado = id && id.indexOf('COLOQUE_AQUI') !== 0;

	if (configurado) {
		var script = document.createElement('script');
		script.async = true;
		script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
		document.head.appendChild(script);

		window.dataLayer = window.dataLayer || [];
		window.gtag = function () {
			window.dataLayer.push(arguments);
		};
		window.gtag('js', new Date());
		window.gtag('config', id);
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.addEventListener('click', function (event) {
			var link = event.target.closest ? event.target.closest('a[href*="api.whatsapp.com"]') : null;
			if (!link || typeof window.gtag !== 'function') {
				return;
			}
			window.gtag('event', 'contato_whatsapp', {
				event_category: 'engajamento',
				event_label: link.href
			});
		});
	});
})();
