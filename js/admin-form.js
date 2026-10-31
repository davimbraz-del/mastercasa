(function () {
	// Cada item: { url: string, file: File (se ainda não enviada) }
	var fotos = [];

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
		var inputFotos = document.getElementById('fotos');
		var id = paramId();

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

				var urlsExistentes = resposta.data.photos && resposta.data.photos.length
					? resposta.data.photos
					: (resposta.data.photo_url ? [resposta.data.photo_url] : []);

				urlsExistentes.forEach(function (url) {
					fotos.push({ url: url, file: null });
				});
				renderizarGaleria();
			});
		}

		if (inputFotos) {
			inputFotos.addEventListener('change', function () {
				Array.prototype.forEach.call(inputFotos.files, function (file) {
					fotos.push({ url: URL.createObjectURL(file), file: file });
				});
				inputFotos.value = '';
				renderizarGaleria();
			});
		}

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			salvar(id, user);
		});
	}

	function renderizarGaleria() {
		var galeria = document.getElementById('fotosGaleria');
		if (!galeria) {
			return;
		}

		galeria.innerHTML = '';

		fotos.forEach(function (foto, indice) {
			var item = document.createElement('div');
			item.className = 'foto-item';

			var img = document.createElement('img');
			img.src = foto.url;
			img.alt = 'Foto ' + (indice + 1);
			item.appendChild(img);

			if (indice === 0) {
				var selo = document.createElement('span');
				selo.className = 'foto-item-capa';
				selo.textContent = 'Capa';
				item.appendChild(selo);
			}

			var remover = document.createElement('button');
			remover.type = 'button';
			remover.className = 'foto-item-remover';
			remover.setAttribute('aria-label', 'Remover foto');
			remover.textContent = '×';
			remover.addEventListener('click', function () {
				fotos.splice(indice, 1);
				renderizarGaleria();
			});
			item.appendChild(remover);

			galeria.appendChild(item);
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
		var nomeArquivo = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		return window.mastercasaDB.storage
			.from('property-photos')
			.upload(nomeArquivo, arquivo)
			.then(function (resposta) {
				if (resposta.error) {
					alert('Erro ao enviar uma das fotos: ' + resposta.error.message);
					return null;
				}
				var urlPublica = window.mastercasaDB.storage.from('property-photos').getPublicUrl(resposta.data.path);
				return urlPublica.data.publicUrl;
			});
	}

	function enviarTodasAsFotos() {
		var promessas = fotos.map(function (foto) {
			if (!foto.file) {
				return Promise.resolve(foto.url);
			}
			return enviarFoto(foto.file);
		});
		return Promise.all(promessas).then(function (urls) {
			return urls.filter(Boolean);
		});
	}

	function salvar(id, user) {
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

		enviarTodasAsFotos()
			.then(function (urls) {
				dados.photos = urls;
				dados.photo_url = urls.length ? urls[0] : null;

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
