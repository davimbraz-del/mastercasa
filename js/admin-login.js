(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var form = document.getElementById('formLogin');
		var erroEl = document.getElementById('loginErro');
		var formEsqueci = document.getElementById('formEsqueciSenha');
		var mostrarEsqueci = document.getElementById('mostrarEsqueciSenha');
		var mostrarLoginDeVolta = document.getElementById('mostrarLoginDeVolta');
		var esqueciErro = document.getElementById('esqueciErro');
		var esqueciSucesso = document.getElementById('esqueciSucesso');

		if (!form) {
			return;
		}

		if (mostrarEsqueci) {
			mostrarEsqueci.addEventListener('click', function (event) {
				event.preventDefault();
				form.hidden = true;
				formEsqueci.hidden = false;
			});
		}

		if (mostrarLoginDeVolta) {
			mostrarLoginDeVolta.addEventListener('click', function (event) {
				event.preventDefault();
				formEsqueci.hidden = true;
				form.hidden = false;
			});
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

		if (formEsqueci) {
			formEsqueci.addEventListener('submit', function (event) {
				event.preventDefault();
				esqueciErro.hidden = true;
				esqueciSucesso.hidden = true;

				if (!window.mastercasaDB) {
					esqueciErro.textContent = 'O Supabase ainda não foi configurado neste site.';
					esqueciErro.hidden = false;
					return;
				}

				var email = document.getElementById('esqueciEmail').value.trim();
				var redirectTo = window.location.origin + '/redefinir-senha.html';

				window.mastercasaDB.auth.resetPasswordForEmail(email, { redirectTo: redirectTo }).then(function (resposta) {
					if (resposta.error) {
						esqueciErro.textContent = resposta.error.message;
						esqueciErro.hidden = false;
						return;
					}
					esqueciSucesso.textContent = 'Link enviado! Confira seu e-mail (e a caixa de spam).';
					esqueciSucesso.hidden = false;
				});
			});
		}
	});
})();
