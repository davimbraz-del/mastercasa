(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var form = document.getElementById('formLogin');
		var erroEl = document.getElementById('loginErro');
		if (!form) {
			return;
		}

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			erroEl.hidden = true;

			if (!window.mastercasaDB) {
				erroEl.textContent = 'O Supabase ainda não foi configurado neste site.';
				erroEl.hidden = false;
				return;
			}

			var email = document.getElementById('email').value.trim();
			var senha = document.getElementById('senha').value;

			window.mastercasaDB.auth.signInWithPassword({ email: email, password: senha }).then(function (resposta) {
				if (resposta.error) {
					erroEl.textContent = resposta.error.message === 'Email not confirmed'
						? 'Seu e-mail ainda não foi confirmado. Confirme pelo link enviado ou peça ao administrador do Supabase para confirmar manualmente.'
						: 'E-mail ou senha incorretos.';
					erroEl.hidden = false;
					return;
				}
				window.location.href = 'index.html';
			});
		});
	});
})();
