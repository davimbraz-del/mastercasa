// Inicializa o cliente Supabase compartilhado pelo site público, pelo
// painel do corretor e pela área do cliente. Depende de js/supabase-config.js
// e do script da CDN do Supabase terem sido carregados antes deste arquivo.
(function () {
	var configurado =
		window.SUPABASE_URL &&
		window.SUPABASE_ANON_KEY &&
		window.SUPABASE_URL.indexOf('COLOQUE_AQUI') !== 0;

	window.MASTERCASA_SUPABASE_CONFIGURADO = !!configurado;

	if (!window.supabase || !window.supabase.createClient) {
		console.error('Biblioteca do Supabase não carregada. Confira o script da CDN em js/supabase-client.js.');
		return;
	}

	if (!configurado) {
		console.warn('Supabase ainda não configurado: edite js/supabase-config.js com a URL e a chave do seu projeto.');
		return;
	}

	window.mastercasaDB = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
})();
