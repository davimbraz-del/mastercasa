(function () {
	var LABELS = { venda: 'Venda', aluguel: 'Aluguel', lancamento: 'Lançamento' };
	var WHATSAPP_NUMBER = '5581999778291';

	document.addEventListener('DOMContentLoaded', function () {
		if (!window.MastercasaClienteAuth) {
			return;
		}

		window.MastercasaClienteAuth.exigirLogin(function (user) {
			var nomeEl = document.getElementById('nomeUsuario');
			if (nomeEl) {
				nomeEl.textContent = user.email;
			}
			carregarFavoritos(user);
		});

		var sairBtn = document.getElementById('botaoSair');
		if (sairBtn) {
			sairBtn.addEventListener('click', function () {
				window.MastercasaClienteAuth.sair();
			});
		}
	});

	function carregarFavoritos(user) {
		var grid = document.getElementById('favoritosGrid');
		var vazio = document.getElementById('favoritosVazio');
		if (!grid) {
			return;
		}

		window.mastercasaDB
			.from('favorites')
			.select('property_id, properties(*)')
			.then(function (resposta) {
				if (resposta.error) {
					alert('Erro ao carregar favoritos: ' + resposta.error.message);
					return;
				}

				var linhas = (resposta.data || []).filter(function (linha) {
					return !!linha.properties;
				});

				grid.innerHTML = '';
				if (vazio) {
					vazio.hidden = linhas.length !== 0;
				}

				linhas.forEach(function (linha) {
					grid.appendChild(criarCard(linha.properties, user));
				});
			});
	}

	function formatarPreco(property) {
		if (property.transaction_type === 'lancamento') {
			return 'Condições especiais de pagamento';
		}
		if (property.price === null || property.price === undefined) {
			return 'Valor sob consulta';
		}
		return 'R$ ' + Number(property.price).toLocaleString('pt-BR');
	}

	function montarMeta(property) {
		if (property.meta_text) {
			return property.meta_text;
		}
		var partes = [];
		if (property.bedrooms) {
			partes.push(property.bedrooms + (property.bedrooms === 1 ? ' quarto' : ' quartos'));
		} else if (property.property_type) {
			partes.push(property.property_type);
		}
		if (property.parking) {
			partes.push(property.parking + (property.parking === 1 ? ' vaga' : ' vagas'));
		}
		if (property.size) {
			partes.push(property.size + ' m²');
		}
		return partes.join(' · ');
	}

	function criarCard(property, user) {
		var label = LABELS[property.transaction_type] || 'Imóvel';

		var card = document.createElement('article');
		card.className = 'property-card';

		var thumb = document.createElement('div');
		thumb.className = 'property-thumb';
		if (property.photo_url) {
			var img = document.createElement('img');
			img.className = 'property-photo';
			img.src = property.photo_url;
			img.alt = property.title || '';
			thumb.appendChild(img);
		}

		var badge = document.createElement('span');
		badge.className = 'property-badge';
		badge.textContent = label;
		thumb.appendChild(badge);

		var body = document.createElement('div');
		body.className = 'property-body';

		var h3 = document.createElement('h3');
		h3.textContent = property.title;
		body.appendChild(h3);

		var meta = montarMeta(property);
		if (meta) {
			var metaEl = document.createElement('p');
			metaEl.className = 'property-meta';
			metaEl.textContent = meta;
			body.appendChild(metaEl);
		}

		var priceEl = document.createElement('p');
		priceEl.className = 'property-price';
		priceEl.textContent = formatarPreco(property);
		body.appendChild(priceEl);

		var link = document.createElement('a');
		link.className = 'btn btn-outline btn-block';
		link.target = '_blank';
		link.rel = 'noopener';
		var mensagem = 'Olá! Tenho interesse no imóvel: ' + property.title + ' (' + label + ').';
		link.href = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(mensagem);
		link.textContent = 'Tenho interesse';
		body.appendChild(link);

		var remover = document.createElement('button');
		remover.type = 'button';
		remover.className = 'btn btn-outline btn-block';
		remover.style.marginTop = '8px';
		remover.textContent = 'Remover dos favoritos';
		remover.addEventListener('click', function () {
			window.mastercasaDB
				.from('favorites')
				.delete()
				.eq('user_id', user.id)
				.eq('property_id', property.id)
				.then(function (resposta) {
					if (resposta.error) {
						alert('Não foi possível remover: ' + resposta.error.message);
						return;
					}
					carregarFavoritos(user);
				});
		});
		body.appendChild(remover);

		card.appendChild(thumb);
		card.appendChild(body);
		return card;
	}
})();
