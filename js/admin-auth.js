// Checagem de acesso compartilhada pelas páginas do painel do corretor.
// Usa window.mastercasaDB (ver js/supabase-client.js), carregado antes deste arquivo.
(function () {
	window.MastercasaAdminAuth = {
		exigirCorretor: function (callback) {
			if (!window.mastercasaDB) {
				alert('O Supabase ainda não foi configurado neste site (js/supabase-config.js).');
				window.location.href = '../index.html';
				return;
			}

			window.mastercasaDB.auth.getSession().then(function (resultado) {
				var sessao = resultado && resultado.data && resultado.data.session;

				if (!sessao) {
					window.location.href = 'login.html';
					return;
				}

				window.mastercasaDB
					.from('profiles')
					.select('role, name')
					.eq('id', sessao.user.id)
					.single()
					.then(function (resposta) {
						if (resposta.error || !resposta.data || resposta.data.role !== 'corretor') {
							alert('Esta conta não tem acesso ao painel do corretor.');
							window.mastercasaDB.auth.signOut().then(function () {
								window.location.href = 'login.html';
							});
							return;
						}

						callback(sessao.user, resposta.data);
					});
			});
		},

		sair: function () {
			if (!window.mastercasaDB) {
				return;
			}
			window.mastercasaDB.auth.signOut().then(function () {
				window.location.href = 'login.html';
			});
		}
	};
})();
