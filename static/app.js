const map = L.map('map').setView([36.2048, 138.2529], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'CCB Maps'
}).addTo(map);

const markers = L.markerClusterGroup();

let marcadores = [];
let userMarker = null;
let userCircle = null;

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function abrirBottomSheet(igreja, tituloPersonalizado = null, distancia = null) {
    const sheet = document.getElementById("bottomSheet");

    document.getElementById("bsNome").innerText =
        tituloPersonalizado || igreja.nome;

    document.getElementById("bsProvincia").innerText =
        distancia
            ? `${igreja.provincia} • ${distancia.toFixed(1)} km`
            : igreja.provincia;

    document.getElementById("bsEndereco").innerText = igreja.endereco;

    document.getElementById("bsGoogle").href =
        `https://www.google.com/maps?q=${igreja.lat},${igreja.lng}`;

    document.getElementById("bsApple").href =
        `http://maps.apple.com/?ll=${igreja.lat},${igreja.lng}`;

    sheet.classList.add("active");
}

function fecharBottomSheet() {
    document.getElementById("bottomSheet").classList.remove("active");
}

function ativarMenu(id) {
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
}

fetch("/dados")
    .then(response => response.json())
    .then(igrejas => {

        igrejas.forEach(igreja => {

            if (!igreja.tem_mapa) {
                return;
            }

            const marker = L.marker([igreja.lat, igreja.lng]);

            marker.on("click", function () {
                abrirBottomSheet(igreja);
            });

            markers.addLayer(marker);

            marcadores.push({
                nome: igreja.nome.toLowerCase(),
                provincia: igreja.provincia.toLowerCase(),
                endereco: igreja.endereco.toLowerCase(),
                marker: marker,
                lat: igreja.lat,
                lng: igreja.lng,
                dados: igreja
            });

        });

        map.addLayer(markers);

    });

const searchInput = document.getElementById("search");
const resultsList = document.getElementById("resultsList");

searchInput.addEventListener("input", function () {
    const texto = searchInput.value.toLowerCase().trim();

    resultsList.innerHTML = "";

    if (texto.length < 2) {
        resultsList.style.display = "none";
        return;
    }

    const resultados = marcadores.filter(item =>
        item.nome.includes(texto) ||
        item.provincia.includes(texto) ||
        item.endereco.includes(texto)
    );

    if (resultados.length === 0) {
        resultsList.style.display = "none";
        return;
    }

    resultados.slice(0, 6).forEach(item => {
        const div = document.createElement("div");
        div.className = "result-item";

        div.innerHTML = `
            <strong>${item.dados.nome}</strong>
            <small>${item.dados.provincia}<br>${item.dados.endereco}</small>
        `;

        div.addEventListener("click", function () {
            map.setView([item.lat, item.lng], 14);
            abrirBottomSheet(item.dados);
            resultsList.style.display = "none";
            searchInput.blur();
        });

        resultsList.appendChild(div);
    });

    resultsList.style.display = "block";
});

const btnLocation = document.getElementById("btnLocation");

btnLocation.addEventListener("click", function () {
    if (!navigator.geolocation) {
        alert("Seu navegador não suporta localização.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            map.setView([lat, lng], 14);

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
                `)
                .openPopup();

            userCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: "#136aec",
                fillColor: "#136aec",
                fillOpacity: 0.15
            }).addTo(map);

            let igrejaMaisProxima = null;
            let menorDistancia = Infinity;

            marcadores.forEach(item => {
                const distancia = calcularDistancia(
                    lat,
                    lng,
                    item.lat,
                    item.lng
                );

                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    igrejaMaisProxima = item;
                }
            });

            if (igrejaMaisProxima) {
                abrirBottomSheet(
                    igrejaMaisProxima.dados,
                    `⛪ Igreja mais próxima: ${igrejaMaisProxima.dados.nome}`,
                    menorDistancia
                );
            }
        },
        function () {
            alert("Não foi possível acessar sua localização.");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
});

document.getElementById("closeSheet").addEventListener("click", fecharBottomSheet);

document.getElementById("menuMap").addEventListener("click", function () {
    ativarMenu("menuMap");
    fecharBottomSheet();
    resultsList.style.display = "none";
    map.setView([36.2048, 138.2529], 5);
});

document.getElementById("menuFavorites").addEventListener("click", function () {
    ativarMenu("menuFavorites");
    alert("Favoritos será adicionado na próxima etapa.");
});

document.getElementById("menuConfig").addEventListener("click", function () {
    ativarMenu("menuConfig");
    alert("Configurações será adicionado na próxima etapa.");
});