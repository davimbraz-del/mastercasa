// Checagem de login compartilhada pelas páginas da área do cliente.
(function () {
	window.MastercasaClienteAuth = {
		exigirLogin: function (callback) {
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

				callback(sessao.user);
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
