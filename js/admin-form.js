(function () {
	document.addEventListener('DOMContentLoaded', function () {
		if (!window.MastercasaAdminAuth) {
			return;
		}

		window.MastercasaAdminAuth.exigirCorretor(function (user) {
			iniciar(user);
		});

		var sairBtn = document.getElementById('botaoSair');
		if (sairBtn) {
			sairBtn.addEventListener('click', function () {
				window.MastercasaAdminAuth.sair();
			});
		}
	});

	function paramId() {
		var params = new URLSearchParams(window.location.search);
		return params.get('id');
	}

	function iniciar(user) {
		var form = document.getElementById('formImovel');
		var tituloPagina = document.getElementById('tituloPagina');
		var id = paramId();
		var fotoAtualUrl = null;

		if (id) {
			if (tituloPagina) {
				tituloPagina.textContent = 'Editar imóvel';
			}

			window.mastercasaDB.from('properties').select('*').eq('id', id).single().then(function (resposta) {
				if (resposta.error || !resposta.data) {
					alert('Imóvel não encontrado.');
					window.location.href = 'index.html';
					return;
				}
				preencherForm(resposta.data);
				fotoAtualUrl = resposta.data.photo_url;
			});
		}

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			salvar(id, user, fotoAtualUrl);
		});
	}

	function preencherForm(imovel) {
		document.getElementById('title').value = imovel.title || '';
		document.getElementById('transaction_type').value = imovel.transaction_type || 'venda';
		document.getElementById('property_type').value = imovel.property_type || '';
		document.getElementById('price').value = imovel.price != null ? imovel.price : '';
		document.getElementById('size').value = imovel.size != null ? imovel.size : '';
		document.getElementById('bedrooms').value = imovel.bedrooms != null ? imovel.bedrooms : '';
		document.getElementById('parking').value = imovel.parking != null ? imovel.parking : '';
		document.getElementById('location').value = imovel.location || '';
		document.getElementById('description').value = imovel.description || '';
		document.getElementById('meta_text').value = imovel.meta_text || '';

		var preview = document.getElementById('fotoPreview');
		if (preview && imovel.photo_url) {
			preview.src = imovel.photo_url;
			preview.hidden = false;
		}
	}

	function valorNumerico(campoId) {
		var valor = document.getElementById(campoId).value;
		return valor === '' ? null : Number(valor);
	}

	function valorInteiro(campoId) {
		var valor = document.getElementById(campoId).value;
		return valor === '' ? null : parseInt(valor, 10);
	}

	function enviarFoto(arquivo) {
		var nomeArquivo = Date.now() + '-' + arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		return window.mastercasaDB.storage
			.from('property-photos')
			.upload(nomeArquivo, arquivo)
			.then(function (resposta) {
				if (resposta.error) {
					alert('Erro ao enviar a foto: ' + resposta.error.message);
					return null;
				}
				var urlPublica = window.mastercasaDB.storage.from('property-photos').getPublicUrl(resposta.data.path);
				return urlPublica.data.publicUrl;
			});
	}

	function salvar(id, user, fotoAtualUrl) {
		var botaoSalvar = document.getElementById('botaoSalvar');
		if (botaoSalvar) {
			botaoSalvar.disabled = true;
			botaoSalvar.textContent = 'Salvando...';
		}

		var dados = {
			title: document.getElementById('title').value.trim(),
			transaction_type: document.getElementById('transaction_type').value,
			property_type: document.getElementById('property_type').value.trim() || null,
			price: valorNumerico('price'),
			size: valorNumerico('size'),
			bedrooms: valorInteiro('bedrooms'),
			parking: valorInteiro('parking'),
			location: document.getElementById('location').value.trim() || null,
			description: document.getElementById('description').value.trim() || null,
			meta_text: document.getElementById('meta_text').value.trim() || null
		};

		var arquivoFoto = document.getElementById('foto').files[0];
		var promessaFoto = arquivoFoto ? enviarFoto(arquivoFoto) : Promise.resolve(fotoAtualUrl);

		promessaFoto
			.then(function (urlFoto) {
				dados.photo_url = urlFoto || null;

				if (id) {
					return window.mastercasaDB.from('properties').update(dados).eq('id', id);
				}
				dados.created_by = user.id;
				return window.mastercasaDB.from('properties').insert(dados);
			})
			.then(function (resposta) {
				if (resposta.error) {
					alert('Erro ao salvar: ' + resposta.error.message);
					if (botaoSalvar) {
						botaoSalvar.disabled = false;
						botaoSalvar.textContent = 'Salvar imóvel';
					}
					return;
				}
				window.location.href = 'index.html';
			});
	}
})();
