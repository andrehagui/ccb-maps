const map = L.map('map').setView([36.2048, 138.2529], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'CCB Maps'
}).addTo(map);

const markers = L.markerClusterGroup();

let marcadores = [];
let todasIgrejas = [];
let userMarker = null;
let userCircle = null;

function abrirBottomSheet(igreja) {
    const sheet = document.getElementById("bottomSheet");

    document.getElementById("bsNome").innerText = igreja.nome;
    document.getElementById("bsProvincia").innerText = igreja.provincia;
    document.getElementById("bsEndereco").innerText = igreja.endereco;

    const google = document.getElementById("bsGoogle");
    const apple = document.getElementById("bsApple");

    if (igreja.tem_mapa && igreja.lat && igreja.lng) {
        google.style.display = "block";
        apple.style.display = "block";

        google.href = `https://www.google.com/maps?q=${igreja.lat},${igreja.lng}`;
        apple.href = `http://maps.apple.com/?ll=${igreja.lat},${igreja.lng}`;
    } else {
        google.style.display = "none";
        apple.style.display = "none";
    }

    sheet.classList.add("active");
}

function fecharBottomSheet() {
    document.getElementById("bottomSheet").classList.remove("active");
}

fetch("/dados")
    .then(response => response.json())
    .then(igrejas => {
        todasIgrejas = igrejas;

        igrejas.forEach(igreja => {
            if (igreja.tem_mapa && igreja.lat && igreja.lng) {
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
            }
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

    const resultados = todasIgrejas.filter(igreja =>
        igreja.nome.toLowerCase().includes(texto) ||
        igreja.provincia.toLowerCase().includes(texto) ||
        igreja.endereco.toLowerCase().includes(texto)
    );

    if (resultados.length === 0) {
        resultsList.style.display = "none";
        return;
    }

    resultados.slice(0, 8).forEach(igreja => {
        const div = document.createElement("div");
        div.className = "result-item";

        div.innerHTML = `
            <strong>${igreja.nome}</strong>
            <small>${igreja.provincia}<br>${igreja.endereco}</small>
        `;

        div.addEventListener("click", function () {
            if (igreja.tem_mapa && igreja.lat && igreja.lng) {
                map.setView([igreja.lat, igreja.lng], 14);
            }

            abrirBottomSheet(igreja);
            resultsList.style.display = "none";
            searchInput.blur();
        });

        resultsList.appendChild(div);
    });

    resultsList.style.display = "block";
});

document.getElementById("closeSheet").addEventListener("click", fecharBottomSheet);