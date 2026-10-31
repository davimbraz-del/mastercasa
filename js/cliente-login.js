(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var formLogin = document.getElementById('formLogin');
		var formCadastro = document.getElementById('formCadastro');
		var formEsqueci = document.getElementById('formEsqueciSenha');
		var mostrarCadastro = document.getElementById('mostrarCadastro');
		var mostrarLogin = document.getElementById('mostrarLogin');
		var mostrarEsqueci = document.getElementById('mostrarEsqueciSenha');
		var mostrarLoginDeVolta = document.getElementById('mostrarLoginDeVolta');
		var loginErro = document.getElementById('loginErro');
		var cadastroErro = document.getElementById('cadastroErro');
		var cadastroSucesso = document.getElementById('cadastroSucesso');
		var esqueciErro = document.getElementById('esqueciErro');
		var esqueciSucesso = document.getElementById('esqueciSucesso');

		function mostrarApenas(form) {
			[formLogin, formCadastro, formEsqueci].forEach(function (f) {
				if (f) {
					f.hidden = f !== form;
				}
			});
		}

		if (mostrarCadastro) {
			mostrarCadastro.addEventListener('click', function (event) {
				event.preventDefault();
				mostrarApenas(formCadastro);
			});
		}

		if (mostrarLogin) {
			mostrarLogin.addEventListener('click', function (event) {
				event.preventDefault();
				mostrarApenas(formLogin);
			});
		}

		if (mostrarEsqueci) {
			mostrarEsqueci.addEventListener('click', function (event) {
				event.preventDefault();
				mostrarApenas(formEsqueci);
			});
		}

		if (mostrarLoginDeVolta) {
			mostrarLoginDeVolta.addEventListener('click', function (event) {
				event.preventDefault();
				mostrarApenas(formLogin);
			});
		}

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

		if (formLogin) {
			formLogin.addEventListener('submit', function (event) {
				event.preventDefault();
				loginErro.hidden = true;

				if (!window.mastercasaDB) {
					loginErro.textContent = 'O Supabase ainda não foi configurado neste site.';
					loginErro.hidden = false;
					return;
				}

				var email = document.getElementById('loginEmail').value.trim();
				var senha = document.getElementById('loginSenha').value;

				window.mastercasaDB.auth.signInWithPassword({ email: email, password: senha }).then(function (resposta) {
					if (resposta.error) {
						loginErro.textContent = resposta.error.message === 'Email not confirmed'
							? 'Seu e-mail ainda não foi confirmado. Confirme pelo link enviado ou peça ao administrador do Supabase para confirmar manualmente.'
							: 'E-mail ou senha incorretos.';
						loginErro.hidden = false;
						return;
					}
					window.location.href = 'favoritos.html';
				});
			});
		}

		if (formCadastro) {
			formCadastro.addEventListener('submit', function (event) {
				event.preventDefault();
				cadastroErro.hidden = true;
				cadastroSucesso.hidden = true;

				if (!window.mastercasaDB) {
					cadastroErro.textContent = 'O Supabase ainda não foi configurado neste site.';
					cadastroErro.hidden = false;
					return;
				}

				var nome = document.getElementById('cadastroNome').value.trim();
				var email = document.getElementById('cadastroEmail').value.trim();
				var senha = document.getElementById('cadastroSenha').value;

				window.mastercasaDB.auth
					.signUp({ email: email, password: senha, options: { data: { name: nome } } })
					.then(function (resposta) {
						if (resposta.error) {
							cadastroErro.textContent = resposta.error.message;
							cadastroErro.hidden = false;
							return;
						}

						if (resposta.data && resposta.data.session) {
							window.location.href = 'favoritos.html';
							return;
						}

						cadastroSucesso.textContent = 'Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.';
						cadastroSucesso.hidden = false;
						formCadastro.reset();
					});
			});
		}
	});
})();
