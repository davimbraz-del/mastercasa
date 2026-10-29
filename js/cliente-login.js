(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var formLogin = document.getElementById('formLogin');
		var formCadastro = document.getElementById('formCadastro');
		var mostrarCadastro = document.getElementById('mostrarCadastro');
		var mostrarLogin = document.getElementById('mostrarLogin');
		var loginErro = document.getElementById('loginErro');
		var cadastroErro = document.getElementById('cadastroErro');
		var cadastroSucesso = document.getElementById('cadastroSucesso');

		if (mostrarCadastro) {
			mostrarCadastro.addEventListener('click', function (event) {
				event.preventDefault();
				formLogin.hidden = true;
				formCadastro.hidden = false;
			});
		}

		if (mostrarLogin) {
			mostrarLogin.addEventListener('click', function (event) {
				event.preventDefault();
				formCadastro.hidden = true;
				formLogin.hidden = false;
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
						loginErro.textContent = 'E-mail ou senha incorretos.';
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
