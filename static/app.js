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

fetch("/dados")
    .then(response => response.json())
    .then(igrejas => {

        igrejas.forEach(igreja => {

            if (!igreja.tem_mapa) {
                return;
            }

            const marker = L.marker([igreja.lat, igreja.lng]);

            marker.on("click", function () {

                const sheet = document.getElementById("bottomSheet");

                document.getElementById("bsNome").innerText =
                    igreja.nome;

                document.getElementById("bsProvincia").innerText =
                    igreja.provincia;

                document.getElementById("bsEndereco").innerText =
                    igreja.endereco;

                document.getElementById("bsGoogle").href =
                    `https://www.google.com/maps?q=${igreja.lat},${igreja.lng}`;

                document.getElementById("bsApple").href =
                    `http://maps.apple.com/?ll=${igreja.lat},${igreja.lng}`;

                sheet.classList.add("active");

                map.setView([igreja.lat, igreja.lng], 13);

            });

            markers.addLayer(marker);

            marcadores.push({
                nome: igreja.nome.toLowerCase(),
                provincia: igreja.provincia.toLowerCase(),
                endereco: igreja.endereco.toLowerCase(),
                marker: marker,
                lat: igreja.lat,
                lng: igreja.lng,
                igreja: igreja
            });

        });

        map.addLayer(markers);

    });

const searchInput = document.getElementById("search");

searchInput.addEventListener("keyup", function () {

    const texto = searchInput.value.toLowerCase();

    marcadores.forEach(item => {

        if (
            item.nome.includes(texto) ||
            item.provincia.includes(texto) ||
            item.endereco.includes(texto)
        ) {

            map.setView([item.lat, item.lng], 12);

            item.marker.fire("click");

        }

    });

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
                .addTo(map);
                

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
                    igrejaMaisProxima = item.igreja;

                }

            });

            if (igrejaMaisProxima) {

                document.getElementById("bsNome").innerText =
                    `Igreja mais próxima: ${igrejaMaisProxima.nome}`;

                document.getElementById("bsProvincia").innerText =
                    `${igrejaMaisProxima.provincia} • ${menorDistancia.toFixed(1)} km`;

                document.getElementById("bsEndereco").innerText =
                    igrejaMaisProxima.endereco;

                document.getElementById("bsGoogle").href =
                    `https://www.google.com/maps?q=${igrejaMaisProxima.lat},${igrejaMaisProxima.lng}`;

                document.getElementById("bsApple").href =
                    `http://maps.apple.com/?ll=${igrejaMaisProxima.lat},${igrejaMaisProxima.lng}`;

                document.getElementById("bottomSheet")
                    .classList.add("active");

            }

        },

        function () {

            alert("Não foi possível acessar sua localização.");

        }

    );

});

window.addEventListener("load", function () {

    const closeSheet =
        document.getElementById("closeSheet");

    if (closeSheet) {

        closeSheet.addEventListener("click", function () {

            document.getElementById("bottomSheet")
                .classList.remove("active");

        });

    }

});

map.on("click", function () {

    document.getElementById("bottomSheet")
        .classList.remove("active");

});