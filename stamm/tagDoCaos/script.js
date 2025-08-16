/**
 * Busca o player atualizado da API
 * @param {string} phone - Telefone do jogador
 * @returns {Promise} Promise com os dados do player
 */
function showBoxLoading(boxId, msg) {
    const box = document.getElementById(boxId);
    if (!box) return;
    let loading = box.querySelector('.box-loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.className = 'box-loading';
        loading.innerHTML = `<div class="spinner box-spinner"></div><div style="text-align:center; color:#253727; font-size:1rem; margin-top:0.7rem;">${msg || '...'}</div>`;
        box.appendChild(loading);
    }
    loading.style.display = 'flex';
    loading.style.flexDirection = 'column';
    loading.style.alignItems = 'center';
    loading.style.justifyContent = 'center';
    // Oculta o conteúdo do box, exceto o loading
    Array.from(box.children).forEach(child => {
        if (child !== loading) child.style.display = 'none';
    });
}
function hideBoxLoading(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    const loading = box.querySelector('.box-loading');
    if (loading) loading.style.display = 'none';
    // Mostra o conteúdo do box
    Array.from(box.children).forEach(child => {
        if (child !== loading) child.style.display = '';
    });
}
function fetchPlayer(phone) {
    const playerParams = new URLSearchParams({
        function_: 'getPlayer',
        phone: phone
    });
    const playerURL = `${url}?${playerParams.toString()}`;
    return fetch(playerURL)
        .then(res => res.json())
        .then(data => {
            hideBoxLoading('player-box');
            if (data.status === 'player_found' && data.player) {
                saveToLocalStorage('player', data.player);
                return data.player;
            } else {
                throw new Error(data.error || 'Erro ao buscar player');
            }
        })
        .catch(err => {
            hideBoxLoading('player-box');
            console.error('Erro ao buscar player:', err);
            // Tenta buscar do cache se a API falhar
            const cached = getFromLocalStorage('player');
            return cached && cached.value ? cached.value : null;
        });
}
/**
 * Busca o ranking atual da API
 * @param {number} limit_ - Número máximo de jogadores (padrão: 10)
 * @returns {Promise} Promise com os dados do ranking
 */
function fetchRanking(limit_) {
    const rankingParams = new URLSearchParams({
        function_: 'getRanking',
        limit: limit_
    });
    const rankingURL = `${url}?${rankingParams.toString()}`;
    return fetch(rankingURL)
        .then(res => res.json())
        .then(data => {
            hideBoxLoading('ranking-box');
            if (data.status === 'ranking_success' && data.ranking) {
                // Salva no localStorage para cache
                saveToLocalStorage('ranking', data.ranking);
                return data.ranking;
            } else {
                throw new Error(data.error || 'Erro ao buscar ranking');
            }
        })
        .catch(err => {
            hideBoxLoading('ranking-box');
            console.error('Erro ao buscar ranking:', err);
            // Tenta buscar do cache se a API falhar
            const cached = getFromLocalStorage('ranking');
            return cached && cached.value ? cached.value : [];
        });
}

/**
 * Atualiza a exibição do ranking na tela home
 * @param {Array} ranking - Array com dados do ranking
 * @param {string} currentPlayerPhone - Telefone do jogador atual para destacar
 */
function updateRankingDisplay(ranking, currentPlayerPhone = '') {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    if (!Array.isArray(ranking) || ranking.length === 0) {
        rankingList.innerHTML = '<li style="color:#aaa;">Ranking indisponível</li>';
        return;
    }
    rankingList.innerHTML = '';
    ranking.forEach((player, index) => {
        const li = document.createElement('div');
        const isCurrentPlayer = currentPlayerPhone && player.phone === currentPlayerPhone;
        li.innerHTML = `
            <span class="ranking-position">#${player.position}</span>
            <span class="ranking-nickname" style="font-weight:700;">${player.nickname || 'Player'}</span>
            <span class="ranking-score" style="color:#3e5c3a; font-weight:600;">${player.score}</span>
            ${isCurrentPlayer ? '<span style="color:#0f2d1e; font-size:1.1em;"></span>' : ''}
        `;
        if (isCurrentPlayer) {
            li.style.backgroundColor = 'rgb(151 207 202)';
            li.style.border = '2px solid rgb(37 55 39)';
            li.style.borderRadius = '0px';
            li.style.padding = '2px 2px';
            li.style.color = '#253727';
        }
        rankingList.appendChild(li);
    });
}

/**
 * Função para atualizar ranking manualmente (botão de refresh, etc.)
 */
function refreshRanking() {
    const rankingList = document.getElementById('ranking-list');
    if (rankingList) {
        rankingList.innerHTML = '<li style="color:#aaa;">Atualizando ranking...</li>';
    }
    fetchRanking(400).then(ranking => {
        const currentPlayer = getFromLocalStorage('player');
        const currentPhone = currentPlayer && currentPlayer.value ? currentPlayer.value.phone : (currentPlayer && currentPlayer.phone ? currentPlayer.phone : '');
        updateRankingDisplay(ranking, currentPhone);
    });
}
/**
 * Esconde a mensagem de swipe (aceito/arregou) imediatamente.
 */
function hideSwipeMessage() {
    var swipeMessageDiv = document.getElementById('swipe-message-bg');
    if (swipeMessageDiv) {
        swipeMessageDiv.style.display = 'none';
        swipeMessageDiv.textContent = '';
    }
}

// =====================
//  UTILITÁRIOS GERAIS
// =====================

/**
 * Retorna apenas a minutagem atual (0-59).
 * @returns {number}
 */
function getCurrentMinute() {
    return new Date().getMinutes();
}

/**
 * Retorna um valor de 0 a 4, representando o "peso" do intervalo de 15 minutos.
 * @returns {number}
 */
function getReferenceWeight() {
    return Math.floor(new Date().getMinutes() / 15);
}

/**
 * Salva um valor no localStorage junto com o minuto atual.
 * @param {string} key
 * @param {any} value
 */
function saveToLocalStorage(key, value) {
    try {
        const data = {
            value,
            savedMinute: getCurrentMinute()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

/**
 * Recupera um valor do localStorage (objeto parseado ou null).
 * @param {string} key
 * @returns {any}
 */
function getFromLocalStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        console.log('Error reading from localStorage:', e);
        return null;
    }
}


// =====================
//  VARIÁVEIS GLOBAIS
// =====================

let challengeList = getFromLocalStorage('challengeList') || [];
let bloqueioDesafioDuplicado = false;

const url = `https://script.google.com/macros/s/AKfycbytIsgWKZUCOqbuqZPGkX4xcQDCn6Wm22pI-bPpjomYEi6AQ7a7qu2BJcvHmoJ0qvps/exec`;
const params = new URLSearchParams(window.location.search);


// =====================
//  HANDLERS DE EVENTOS INICIAIS
/**
 * Lida com o swipe do desafio, aceitando ou rejeitando, enviando também os pontos do desafio.
 * @param {'acceptChallenge'|'skipChallenge'} function_
 * @param {string} challengerPhone
 * @param {string} tagID
 */
function handleSwipeChallenge(function_, challengerPhone, tagID) {
    // Recupera os pontos do desafio atual exibido
    let points = 0;
    try {
        // Busca o desafio atual pelo texto exibido
        const desafioText = document.querySelector("#challenge span")?.textContent || "";
        const cached = getFromLocalStorage('challengeList');
        let found = null;
        if (cached && cached.value) {
            // Procura em todos os grupos
            for (const groupKey in cached.value) {
                const arr = cached.value[groupKey];
                if (Array.isArray(arr)) {
                    found = arr.find(item => item.challenge === desafioText);
                    if (found) break;
                }
            }
        }
        if (found && typeof found.points === 'number') {
            points = found.points;
        }
    } catch (e) {
        console.warn('Não foi possível recuperar os pontos do desafio:', e);
    }
    const newParams = new URLSearchParams({
        function_: function_, // 'accept' ou 'reject'
        challengerPhone: challengerPhone,
        tagID: tagID,
        points: points
    });
    const googleScriptURL = `${url}?${newParams.toString()}`;
    // Esconde a mensagem de swipe imediatamente
    hideSwipeMessage();
    showLoading();
    fetch(googleScriptURL)
        .then(res => res.json())
        .then(data => {
            console.log('[Swipe result]', data);
            if (data.status === 'challenge_accepted' || data.status === 'challenge_skipped') {
                // Salva o tagID como último desafiado somente após aceitar ou recusar
                if (tagID) {
                    saveToLocalStorage('lastChallengedTagID', tagID);
                }
                // Após o alerta, navega para home ou recarrega
                const player = getFromLocalStorage('player');
                let nickname = (player && player.value && player.value.nickname) ? player.value.nickname : (player && player.nickname ? player.nickname : '');
                let score = (player && player.value && player.value.score) ? player.value.score : (player && player.score ? player.score : '');
                let skipPoints = (player && player.value && player.value.skipPoints) ? player.value.skipPoints : (player && player.skipPoints ? player.skipPoints : '');
                if (typeof showHome === 'function') {
                    showHome(nickname, score, skipPoints, {});
                } else {
                    window.location.reload();
                }
            } else if (data.error) {
                alert(`Erro: ${data.error}`);
            } else {
                alert('Resposta inesperada da API: ' + JSON.stringify(data));
            }
        })
        .catch(err => {
            console.error('Erro no swipe:', err);
            alert('Erro ao processar desafio.');
        });
}

    /**
     * Exibe o loading global e oculta o mainContent
     */
    /**
 * Exibe o loading global e oculta o mainContent
 */
function showLoading() {
    var loading = document.getElementById('loading');
    var spinner = document.getElementById('spinner');
    var loadingText = document.getElementById('loading-text');
    var retryBtn = document.getElementById('retry-btn');
    var mainContent = document.getElementById('mainContent');
    
    if (loading) loading.style.display = "flex";
    if (spinner) spinner.style.display = "block";
    if (loadingText) loadingText.style.display = "block";
    if (retryBtn) retryBtn.style.display = "none";
    if (mainContent) mainContent.style.display = "none";
}

function hideLoading() {
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = "none";
}

// =====================

/**
 * Handler para copiar o @ do insta e exibir modal.
 */
document.addEventListener("DOMContentLoaded", function () {
    const instaLink = document.getElementById("insta-link");
    const modal = document.getElementById("modal-copied");
    const modalOk = document.getElementById("modal-ok");

    if (instaLink) {
        instaLink.addEventListener("click", function (e) {
            e.preventDefault();
            navigator.clipboard.writeText("@aaascfurb");
            modal.style.display = "flex";
        });
    }
    if (modalOk) {
        modalOk.addEventListener("click", function () {
            modal.style.display = "none";
            window.open("https://www.instagram.com/s/aGlnaGxpZ2h0OjE3OTIwNDU5MTAxMTEyMTk1?story_media_id=3699902489282174044_7922687202&igsh=MTg5cWJxdXlxZDJmNQ==", "_blank");
        });
    }
});


// =====================
//  LÓGICA PRINCIPAL E HANDLERS DE UI
// =====================

/**
 * Handler principal de carregamento e swipe dos desafios.
 */
document.addEventListener("DOMContentLoaded", function () {
    // normaliza params
    const rawReferenceParam = params.get("reference");
    const rawTagParam = params.get("tagID");
    // calcula weight e reference corretamente
    const referenceWeight = getReferenceWeight(); // 0..3
    let baseRef = parseInt(rawReferenceParam, 10);
    if (Number.isNaN(baseRef) || baseRef < 1) baseRef = 1;
    let reference = baseRef + referenceWeight;
    // clamp entre 1 e 5
    if (reference < 1) reference = 1;
    if (reference > 5) reference = 5;

    const tagID = (rawTagParam || "").toString();
    const loading = document.getElementById("loading");
    const mainContent = document.getElementById("mainContent");
    const spinner = document.getElementById("spinner");
    const loadingText = document.getElementById("loading-text");
    const retryBtn = document.getElementById("retry-btn");

    // BLOQUEIO DE DESAFIO DUPLICADO - GARANTE QUE showHome JÁ FOI DEFINIDA
    
    window.addEventListener('load', function () {
        const lastChallengedTag = getFromLocalStorage('lastChallengedTagID');
        if (tagID && lastChallengedTag && lastChallengedTag.value === tagID) {
            // Se tentar desafiar o mesmo player, permanece na home
            const player = getFromLocalStorage('player');
            let nickname = (player && player.value && player.value.nickname) ? player.value.nickname : (player && player.nickname ? player.nickname : '');
            let score = (player && player.value && player.value.score) ? player.value.score : (player && player.score ? player.score : '');
            let skipPoints = (player && player.value && player.value.skipPoints) ? player.value.skipPoints : (player && player.skipPoints ? player.skipPoints : 0);
            // Esconde o loading e mostra home
            if (loading) loading.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            document.getElementById('homeContent').style.display = 'flex';
            // Sempre busca os dados do player atualizados do localStorage
            const playerAtual = getFromLocalStorage('player');
            console.log('[Player]', playerAtual);
            let nickAtual = (playerAtual && playerAtual.value && playerAtual.value.nickname) ? playerAtual.value.nickname : (playerAtual && playerAtual.nickname ? playerAtual.nickname : '');
            let scoreAtual = (playerAtual && playerAtual.value && playerAtual.value.score) ? playerAtual.value.score : (playerAtual && playerAtual.score ? playerAtual.score : '');
            let skipAtual = (playerAtual && playerAtual.value && playerAtual.value.skipPoints) ? playerAtual.value.skipPoints : (playerAtual && playerAtual.skipPoints ? playerAtual.skipPoints : 0);
            console.log('[Player Atual]', nickAtual, scoreAtual, skipAtual);    
            console.log("aqui 0");
            if (typeof window.showHome === 'function') {
                console.log("aqui 1");
                window.showHome(nickAtual, scoreAtual, skipAtual, {});
            }
            bloqueioDesafioDuplicado = true;
            return;
        }
    });

    // Usa a função global showLoading()
    function showRetry() {
        if (spinner) spinner.style.display = "none";
        if (loadingText) loadingText.textContent = "Erro ao carregar desafio.";
        if (retryBtn) retryBtn.style.display = "inline-block";
    }
    function hideLoading() {
        if (loading) loading.style.display = "none";
        if (mainContent) mainContent.style.display = "flex";
    }

function fetchChallenge() {
    showLoading();
    const desafio = document.querySelector("#challenge div");
    const consequencia = document.querySelector("#description div");
    const footer = document.querySelector("#footer");

    // SEMPRE faz a requisição para a API para saber se a tag está cadastrada
    // A validação de player foi REMOVIDA daqui e será feita baseada na resposta da API
    const newParams = new URLSearchParams({
        reference: String(baseRef), // envie o baseRef original (1..5) para que o backend entenda o grupo
        tagID: tagID,
    });
    const googleScriptURL = `${url}?${newParams.toString()}`;

    console.log("[TagDoCaos] fetchChallenge chamando API:", googleScriptURL);

    fetch(googleScriptURL)
        .then((res) => {
            console.log("[TagDoCaos] resposta HTTP:", res.status);
            return res.json();
        })
        .then((data) => {
            console.log("[TagDoCaos] resposta JSON:", data);

            // Se o servidor devolve instrução para cadastro
            if (data.status === "needs_registration" && data.tagID) {
                showModalCustom("Preencha seus dados para participar!");
                // guarda tag para o modal de registro
                if (document.getElementById("modal-nickname")) {
                    window._tagDoCaosTagID = data.tagID;
                }
                if (desafio) desafio.textContent = "Cadastro necessário";
                if (consequencia) consequencia.textContent = "Informe seus dados para começar.";
                if (footer) footer.style.display = "none";
                return;
            }

            // AQUI: Se a API retornou challengeList, mas não temos player local,
            // significa que a tag existe mas perdemos os dados locais
            if (data.status === "challengeList" && data.challengeList) {
                const localPlayer = getFromLocalStorage('player');
                if (!localPlayer && data.player) {
                    // Salva o player que veio da API
                    saveToLocalStorage('player', data.player);
                    if (data.player.phone) saveToLocalStorage('playerphone', data.player.phone);
                } else if (!localPlayer && !data.player) {
                    // Tag existe mas não temos dados do player - solicita recuperação
                    showModalCustom('Digite seu telefone para recuperar a pontuação');
                    if (desafio) desafio.textContent = "Recuperação necessária";
                    if (consequencia) consequencia.textContent = "Informe seu telefone para recuperar seus dados.";
                    if (footer) footer.style.display = "none";
                    return;
                }

                // Processa a lista de desafios normalmente
                saveToLocalStorage('challengeList', data.challengeList);
                const cached = getFromLocalStorage('challengeList');
                const challengeSet = cached && cached.value ? cached.value : data.challengeList;
                const group = String(reference);
                const arrayGroup = challengeSet[group] || challengeSet[baseRef] || [];
                let index = 0;
                if (arrayGroup.length) index = Math.floor(Math.random() * arrayGroup.length);
                const item = arrayGroup[index] || {};
                
                if (item.challengedPhone) {
                    window._tagDoCaosChallengedPhone = item.challengedPhone;
                } else if (item.phone) {
                    window._tagDoCaosChallengedPhone = item.phone;
                } else {
                    window._tagDoCaosChallengedPhone = '';
                }
                
                // Função para converter <br> em quebras de linha HTML
                function convertBrToLineBreaks(text) {
                    if (!text) return '';
                    const div = document.createElement('div');
                    text = text.replace(/<br>/gi, '\n'); // Substitui <br> por \n
                    div.textContent = text; // Usa textContent para escapar HTML
                    return di