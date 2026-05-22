const map = L.map("map").setView([36.2048, 138.2529], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "CCB Maps"
}).addTo(map);

const markers = L.markerClusterGroup();

let marcadores = [];
let userMarker = null;
let userCircle = null;

const searchInput = document.getElementById("search");
const resultsList = document.getElementById("resultsList");
const btnLocation = document.getElementById("btnLocation");
const closeSheet = document.getElementById("closeSheet");

function abrirBottomSheet(igreja, distancia = null) {
    const sheet = document.getElementById("bottomSheet");

    const bsNome = document.getElementById("bsNome");
    const bsProvincia = document.getElementById("bsProvincia");
    const bsEndereco = document.getElementById("bsEndereco");
    const bsGoogle = document.getElementById("bsGoogle");
    const bsApple = document.getElementById("bsApple");

    if (distancia !== null) {
        bsNome.textContent = `⛪ Igreja mais próxima: ${igreja.nome}`;
        bsProvincia.textContent = `${igreja.provincia} • ${distancia.toFixed(1)} km`;
    } else {
        bsNome.textContent = igreja.nome;
        bsProvincia.textContent = igreja.provincia;
    }

    bsEndereco.textContent = igreja.endereco;

    bsGoogle.href = `https://www.google.com/maps?q=${igreja.lat},${igreja.lng}`;
    bsApple.href = `http://maps.apple.com/?ll=${igreja.lat},${igreja.lng}`;

    sheet.classList.add("active");
}

function debounce(fn, delay = 300) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

async function carregarIgrejas() {
    try {
        const response = await fetch("/dados");

        if (!response.ok) {
            throw new Error("Erro ao carregar os dados.");
        }

        const igrejas = await response.json();

        igrejas.forEach((igreja) => {
            if (!igreja.tem_mapa) {
                return;
            }

            const marker = L.marker([igreja.lat, igreja.lng]);

            marker.on("click", () => {
                abrirBottomSheet(igreja);
            });

            markers.addLayer(marker);

            marcadores.push({
                nome: igreja.nome.toLowerCase(),
                provincia: igreja.provincia.toLowerCase(),
                endereco: igreja.endereco.toLowerCase(),
                marker,
                lat: igreja.lat,
                lng: igreja.lng,
                dados: igreja
            });
        });

        map.addLayer(markers);
    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar os dados das igrejas.");
    }
}

function limparResultados() {
    resultsList.innerHTML = "";
    resultsList.style.display = "none";
}

function criarItemResultado(item) {
    const div = document.createElement("div");
    div.className = "result-item";

    const strong = document.createElement("strong");
    strong.textContent = item.dados.nome;

    const span = document.createElement("span");
    span.textContent = `${item.dados.provincia} - ${item.dados.endereco}`;

    div.appendChild(strong);
    div.appendChild(span);

    div.addEventListener("click", () => {
        map.setView([item.lat, item.lng], 14);

        item.marker.fire("click");

        limparResultados();

        searchInput.value = item.dados.nome;
    });

    return div;
}

function pesquisarIgrejas() {
    const texto = searchInput.value.toLowerCase().trim();

    resultsList.innerHTML = "";

    if (texto.length === 0) {
        limparResultados();
        return;
    }

    const resultados = marcadores.filter((item) =>
        item.nome.includes(texto) ||
        item.provincia.includes(texto) ||
        item.endereco.includes(texto)
    );

    if (resultados.length === 0) {
        limparResultados();
        return;
    }

    const fragment = document.createDocumentFragment();

    resultados.forEach((item) => {
        fragment.appendChild(criarItemResultado(item));
    });

    resultsList.appendChild(fragment);
    resultsList.style.display = "block";
}

function encontrarIgrejaMaisProxima(lat, lng) {
    let igrejaMaisProxima = null;
    let menorDistancia = Infinity;

    marcadores.forEach((item) => {
        const distanciaMetros = map.distance(
            [lat, lng],
            [item.lat, item.lng]
        );

        const distanciaKm = distanciaMetros / 1000;

        if (distanciaKm < menorDistancia) {
            menorDistancia = distanciaKm;
            igrejaMaisProxima = item;
        }
    });

    return {
        igrejaMaisProxima,
        menorDistancia
    };
}

function mostrarLocalizacaoUsuario(lat, lng, accuracy) {
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    if (userCircle) {
        map.removeLayer(userCircle);
    }

    userMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`
            Você está aqui<br>
            Precisão: ${Math.round(accuracy)} metros
        `);

    userCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: "#136aec",
        fillColor: "#136aec",
        fillOpacity: 0.15
    }).addTo(map);
}

function localizarUsuario() {
    if (!navigator.geolocation) {
        alert("Seu navegador não suporta localização.");
        return;
    }

    if (marcadores.length === 0) {
        alert("Os dados das igrejas ainda não foram carregados.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            mostrarLocalizacaoUsuario(lat, lng, accuracy);

            const { igrejaMaisProxima, menorDistancia } =
                encontrarIgrejaMaisProxima(lat, lng);

            if (!igrejaMaisProxima) {
                alert("Nenhuma igreja encontrada no mapa.");
                return;
            }

            const bounds = L.latLngBounds([
                [lat, lng],
                [igrejaMaisProxima.lat, igrejaMaisProxima.lng]
            ]);

            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 14
            });

            abrirBottomSheet(
                igrejaMaisProxima.dados,
                menorDistancia
            );
        },
        () => {
            alert("Não foi possível acessar sua localização.");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

searchInput.addEventListener(
    "input",
    debounce(pesquisarIgrejas, 300)
);

btnLocation.addEventListener("click", localizarUsuario);

if (closeSheet) {
    closeSheet.addEventListener("click", () => {
        document
            .getElementById("bottomSheet")
            .classList.remove("active");
    });
}

carregarIgrejas();