const ids = [];

try {
    async function extrairIDsDaPagina(url) {
        const response = await fetch(url);
        const htmlString = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const tdElements = doc.querySelectorAll('.Border td');
        tdElements.forEach(function (td) {
            const id = td.getAttribute('id');
            if (id && id.startsWith('info_')) {
                ids.push(id.replace('info_', ''));
            }
        });
    }

    function gerarURLPagina(numeroPagina) {
        return `transfer-market.php?action=advancedsearchsubmit&position=100&rating=&lowervalue=0&highervalue=60000&lowerage=15&higherage=50&nationality=ANY&lowerrating=60&higherrating=99&fa=0&start=${(numeroPagina - 1) * 50 + 1}&offset=${(numeroPagina - 1) * 50}`;
    }

    // Número de páginas desejadas em "buscar" nas transferências
    var paginas = 40;

    for (let i = 0; i <= paginas; i++) {
        const url = gerarURLPagina(i);
        await extrairIDsDaPagina(url);
        console.log('Extraindo IDs', i, 'de', paginas, 'páginas');
    }

} catch (error) {
    console.error('Ocorreu um erro ao extrair IDs das páginas:', error);
}

async function processarJogador(id) {
    var url = "https://www.soccermanager.com/player.php?pid=" + id;

    try {
        const response = await fetch(url);
        const html = await response.text();

        var temp = document.createElement("div");
        temp.innerHTML = html;

        var playerNameElement = temp.querySelector("#playerScreen-table-factfile-row-playername");
        var playerName = playerNameElement ? playerNameElement.textContent.trim() : "";

        playerName = playerName.replace(" soccer player profile - Soccer Manager", "");

        if (html.includes("Free Agent")) {
            return "";
        }

        var ratingElement = temp.querySelector("#playerScreen-table-factfile-row-rating");
        var rating = ratingElement ? ratingElement.textContent.trim() : "";

        var contractElement = temp.querySelector(".playerfactfile_smalltext");
        var contract = contractElement ? contractElement.textContent.trim() : "";

        var ageElement = temp.querySelector("#playerScreen-table-factfile-row-age");
        var age = ageElement ? ageElement.textContent.trim() : "";

        var tabelas = temp.querySelectorAll("#careerStatisticsTable");

        if (tabelas.length > 0) {
            var tituloPagina = temp.querySelector("title").textContent;

            var dadosOrganizados = "";

            tabelas.forEach(function (tabela) {
                var linhas = tabela.querySelectorAll("tbody tr");

                linhas.forEach(function (linha) {
                    if (linha.textContent.includes("Divisão")) {
                        var celulas = linha.querySelectorAll("td");
                        var linhaDados = tituloPagina;

                        celulas.forEach(function (celula, indice) {
                            linhaDados += ";" + celula.textContent.trim();
                        });

                        linhaDados += ";" + getPositionInfo(temp);
                        linhaDados += ";" + rating;
                        linhaDados += ";" + contract;
                        linhaDados += ";" + age;

                        dadosOrganizados += linhaDados + "\n";
                    }
                });
            });

            dadosOrganizados = dadosOrganizados.trim() + "\n";

            return dadosOrganizados;
        } else {
            console.error("Nenhum elemento com o ID 'careerStatisticsTable' encontrado no URL:", url);
            return "";
        }
    } catch (error) {
        console.error("Ocorreu um erro ao processar o URL:", url, error);
        return "";
    }
}

function getPositionInfo(temp) {
    var positionElement = temp.querySelector("#playerScreen-table-factfile-row-position");
    if (positionElement) {
        return positionElement.textContent.trim();
    }
    return "";
}

function baixarExcel(nomeArquivo, conteudo) {
    const linhas = conteudo.split("\n").filter(row => row.trim() !== "");
    if (linhas.length === 0) {
        console.log("Nenhum dado disponível para exportar.");
        return;
    }
    const header = "Jogador;Temporada;Clube;Divisão;Jogos;Gols;Assistências;Melhor do jogo;Média;Amarelo;Vermelho;Posição;Nível;Contrato;Idade";
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([header.split(";")].concat(linhas.map(row => row.split(";"))));
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    XLSX.writeFile(workbook, `${nomeArquivo}.xlsx`);
}

async function exportarDados() {
    var todosOsDados = "";

    var idsEspecificos = ids;

    for (var i = 0; i < idsEspecificos.length; i++) {

        var id = idsEspecificos[i];
        console.log('Extraindo estatística', i, 'de', idsEspecificos.length - 1);
        var dadosDoJogador = await processarJogador(id);

        if (dadosDoJogador !== "") {
            todosOsDados += dadosDoJogador;
        }
    }

    todosOsDados = todosOsDados.replace(/ soccer player profile - Soccer Manager/g, "");

    baixarExcel("dados", todosOsDados);
    console.log('Extração finalizada!\ndeveloped by @luannamorim (github)');
}

var script = document.createElement('script');
script.onload = function () {
    exportarDados();
};
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.3/xlsx.full.min.js';
document.head.appendChild(script);
