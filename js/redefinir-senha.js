(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var form = document.getElementById('formRedefinir');
		var erroEl = document.getElementById('redefinirErro');
		var sucessoEl = document.getElementById('redefinirSucesso');
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

			var novaSenha = document.getElementById('novaSenha').value;
			var confirmarSenha = document.getElementById('confirmarSenha').value;

			if (novaSenha !== confirmarSenha) {
				erroEl.textContent = 'As senhas digitadas não são iguais.';
				erroEl.hidden = false;
				return;
			}

			window.mastercasaDB.auth.updateUser({ password: novaSenha }).then(function (resposta) {
				if (resposta.error) {
					erroEl.textContent = 'Não foi possível redefinir a senha. O link pode ter expirado — peça um novo e-mail de redefinição.';
					erroEl.hidden = false;
					return;
				}

				form.hidden = true;
				sucessoEl.hidden = false;
			});
		});
	});
})();
