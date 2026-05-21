const map = L.map('map').setView([36.2048, 138.2529], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'CCB Maps'
}).addTo(map);

const markers = L.markerClusterGroup();

let marcadores = [];

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

function abrirBottomSheet(igreja, distancia = null) {

    const sheet = document.getElementById("bottomSheet");

    if (distancia !== null) {

        document.getElementById("bsNome").innerHTML =
            `⛪ Igreja mais próxima: ${igreja.nome}`;

        document.getElementById("bsProvincia").innerHTML =
            `${igreja.provincia} • ${distancia.toFixed(1)} km`;

    } else {

        document.getElementById("bsNome").innerText =
            igreja.nome;

        document.getElementById("bsProvincia").innerText =
            igreja.provincia;

    }

    document.getElementById("bsEndereco").innerText =
        igreja.endereco;

    document.getElementById("bsGoogle").href =
        `https://www.google.com/maps?q=${igreja.lat},${igreja.lng}`;

    document.getElementById("bsApple").href =
        `http://maps.apple.com/?ll=${igreja.lat},${igreja.lng}`;

    sheet.classList.add("active");
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

searchInput.addEventListener("keyup", function () {

    const texto = searchInput.value.toLowerCase().trim();

    resultsList.innerHTML = "";

    if (texto.length === 0) {

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

    resultados.forEach(item => {

        const div = document.createElement("div");

        div.className = "result-item";

        div.innerHTML = `
            <strong>${item.dados.nome}</strong>
            <span>
                ${item.dados.provincia} -
                ${item.dados.endereco}
            </span>
        `;

        div.addEventListener("click", function () {

            map.setView([item.lat, item.lng], 14);

            item.marker.fire("click");

            resultsList.style.display = "none";

            searchInput.value = item.dados.nome;

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

            map.setView([lat, lng], 14);

            const accuracy = position.coords.accuracy;

            L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`
                    Você está aqui<br>
                    Precisão: ${Math.round(accuracy)} metros
                `)
                .openPopup();

            L.circle([lat, lng], {
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

                map.setView(
                    [
                        igrejaMaisProxima.lat,
                        igrejaMaisProxima.lng
                    ],
                    14
                );

                abrirBottomSheet(
                    igrejaMaisProxima.dados,
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

const closeSheet = document.getElementById("closeSheet");

if (closeSheet) {

    closeSheet.addEventListener("click", function () {

        document.getElementById("bottomSheet")
            .classList.remove("active");

    });

}