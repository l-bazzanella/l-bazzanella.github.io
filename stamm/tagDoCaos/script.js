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
            window.open("https://www.instagram.com/s/aGlnaGxpZ2h0OjE3OTIwNDU5MTAxMTEyMTk1", "_blank");
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
                    return div.textContent;
                }

                if (desafio) {
                    const challengeText = convertBrToLineBreaks(item.challenge);
                    desafio.style.whiteSpace = 'pre-wrap'; // Preserva quebras de linha
                    desafio.textContent = challengeText || "Erro ao carregar";
                }
                if (consequencia) {
                    const descriptionText = convertBrToLineBreaks(item.description);
                    consequencia.style.whiteSpace = 'pre-wrap'; // Preserva quebras de linha
                    consequencia.textContent = descriptionText || "Erro ao carregar";
                }
                if (footer) footer.style.display = item.shareable ? "flex" : "none";
                hideLoading();
                return;
            }

            // Se registrou/atualizou o player, servidor pode retornar 'player_registered_or_updated' ou 'new_player_registered'
            if ((data.status === "player_registered_or_updated" || data.status === "new_player_registered" || data.status === "registered") && data.player) {
                if (data.challengeList) {
                    saveToLocalStorage('challengeList', data.challengeList);
                }
                saveToLocalStorage('player', data.player);
                if (data.player.phone) saveToLocalStorage('playerphone', data.player.phone);
                showModalCustom("Você foi registrado! Pronto para os desafios.");
                if (desafio) desafio.textContent = "Bem-vindo!";
                if (consequencia) consequencia.textContent = "Você foi registrado.";
                if (footer) footer.style.display = "none";
                return;
            }

            // Se devolveu player sem challengeList (por exemplo somente consulta de player)
            if (data.status === "player_found" && data.player) {
                if (desafio) desafio.textContent = "Player: " + (data.player.nickname || "");
                if (consequencia) consequencia.textContent = "Score: " + (data.player.score || 0);
                if (footer) footer.style.display = "none";
                return;
            }

            // erro ou inesperado
            if (data.error) {
                if (desafio) desafio.textContent = "Erro";
                if (consequencia) consequencia.textContent = data.error;
                if (footer) footer.style.display = "none";
                return;
            }

            // fallback
            if (desafio) desafio.textContent = "Resposta inesperada";
            if (consequencia) consequencia.textContent = JSON.stringify(data);
            if (footer) footer.style.display = "none";
        })
        .catch((err) => {
            console.error("[TagDoCaos] fetch error:", err);
            showRetry();
        });
}
    retryBtn && retryBtn.addEventListener("click", function () {
        loadingText.textContent = "Carregando desafio...";
        fetchChallenge();
    });

    // getChallenge helper unchanged (ajustada para ler do cache salvo)
    function getChallenge(data) {
        // data é um objeto { challengeList: {...} } ou a resposta inteira
        // se for a resposta direta, normalize
        let cl = data.challengeList || data.challengeList;
        if (!cl && data && data.challengeList) cl = data.challengeList;
        if (!cl) {
            const cached = getFromLocalStorage('challengeList');
            cl = cached && cached.value ? cached.value : {};
        }
        challengeList = cl;
        saveToLocalStorage('challengeList', challengeList);
        const arr = challengeList[String(reference)] || challengeList[String(baseRef)] || [];
        const index = Math.floor(Math.random() * (arr.length || 1));
        return arr[index] || {};
    }

    // --- SWIPE DESAFIO ---
    let startX = null;
    let currentX = null;
    let isDragging = false;
    const box = document.querySelector("#mainContent .box");
    let swipeAction = null; // 'accept' ou 'reject'
    const swipeMessageDiv = document.getElementById('swipe-message-bg');
    if (box) {
        box.style.touchAction = "pan-y";
        box.addEventListener("touchstart", function (e) {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                currentX = startX;
                isDragging = true;
                box.style.transition = "none";
            }
        });
        box.addEventListener("touchmove", function (e) {
            if (!isDragging || e.touches.length !== 1) return;
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            box.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
        });
        box.addEventListener("touchend", function (e) {
            if (!isDragging) return;
            isDragging = false;
            const deltaX = currentX - startX;
            box.style.transition = "transform 0.3s cubic-bezier(.77,0,.18,1)";
            if (deltaX > 80) {
                // Aceitou desafio
                swipeAction = 'accept';
                box.style.transform = `translateX(100vw) rotate(20deg)`;
                setTimeout(() => {
                    box.style.display = 'none';
                    showSwipeMessage('Desafio aceito!');
                    showSwipeUndoCircle('acceptChallenge');
                }, 300);
            } else if (deltaX < -80) {
                // Recusou desafio
                swipeAction = 'reject';
                box.style.transform = `translateX(-100vw) rotate(-20deg)`;
                setTimeout(() => {
                    box.style.display = 'none';
                    showSwipeMessage('Arregou!');
                    showSwipeUndoCircle('skipChallenge');
                }, 300);
            } else {
                box.style.transform = '';
            }
        });
    }

    function showSwipeMessage(msg) {
        if (swipeMessageDiv) {
            swipeMessageDiv.textContent = msg;
            swipeMessageDiv.style.display = 'flex';
        }
    }

    function hideSwipeMessage() {
        if (swipeMessageDiv) {
            swipeMessageDiv.style.display = 'none';
            swipeMessageDiv.textContent = '';
        }
    }

    /**
     * Exibe o círculo de confirmação de swipe com timer para desfazer.
     * @param {string} action
     */
    function showSwipeUndoCircle(action) {
        // Remove modal antigo se existir
        const oldModal = document.getElementById('modal-swipe-confirm');
        if (oldModal) oldModal.style.display = 'none';

        // Cria o círculo se não existir
        let undoCircle = document.getElementById('swipe-undo-circle');
        if (!undoCircle) {
            undoCircle = document.createElement('div');
            undoCircle.id = 'swipe-undo-circle';
            undoCircle.innerHTML = '<span class="undo-label">Desfazer</span><span class="undo-countdown" style="display:none;">5</span>';
            document.body.appendChild(undoCircle);
        } else {
            undoCircle.style.display = 'flex';
            // Reinicia animação
            undoCircle.classList.remove('swipe-undo-anim');
            void undoCircle.offsetWidth;
            // Reinicia contador
            undoCircle.innerHTML = '<span class="undo-label">Desfazer</span><span class="undo-countdown" style="display:none;">5</span>';
        }

        let undone = false;
        // Clique para desfazer
        undoCircle.onclick = function () {
            undone = true;
            undoCircle.style.display = 'none';
            // Volta o card e remove mensagem de fundo
            if (box) {
                box.style.display = 'block';
                box.style.transform = '';
            }
            hideSwipeMessage();
        };

        // Exibe o contador só durante os 5 segundos centrais (0.5s início, 5s, 0.5s fim)
        const countdownSpan = undoCircle.querySelector('.undo-countdown');
        setTimeout(() => {
            if (countdownSpan) {
                countdownSpan.style.display = 'block';
                let count = 5;
                countdownSpan.textContent = count;
                const interval = setInterval(() => {
                    count--;
                    countdownSpan.textContent = count;
                    if (count <= 0) {
                        clearInterval(interval);
                    }
                }, 1000);
            }
        }, 500); // 0.5s após início

        // Esmaece o círculo ao terminar a contagem, depois executa ação
        setTimeout(() => {
            if (!undone) {
                undoCircle.style.display = 'none';
                // Envia resposta do desafio e redireciona para home após resposta da API
                const player = getFromLocalStorage('player');
                const challengerPhone = player && player.value && player.value.phone ? player.value.phone : (player && player.phone ? player.phone : '');
                const tagID = window._tagDoCaosTagID || params.get("tagID");
                handleSwipeChallenge(action, challengerPhone, tagID);
                // hideSwipeMessage será chamado após a resposta da API
            }
        }, 6000);
    }



    const lastChallengedTag = getFromLocalStorage('lastChallengedTagID');
    // Se não há tagID na URL, sempre permite iniciar (ex: primeira visita ou reset)
    if (!tagID) {
        fetchChallenge();
    } else if (!lastChallengedTag || tagID !== lastChallengedTag.value) {
        fetchChallenge();
    }
});


// =====================
//  FUNÇÕES DE MODAL E REGISTRO
// =====================

/**
 * Exibe o modal customizado com mensagem.
 * @param {string} message
 */
function showModalCustom(message) {
    const modal = document.getElementById("modal-custom");
    const msg = document.getElementById("modal-custom-message");
    msg.textContent = message || "Mensagem customizada";
    modal.style.display = "flex";
    // Esconde o loading se estiver visível
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

/** Esconde o modal customizado. */
function hideModalCustom() {
    document.getElementById("modal-custom").style.display = "none";
}

/**
 * Exibe mensagem de erro e botão de tentar novamente.
 * (duplicada para uso fora do escopo DOMContentLoaded)
 */
function showRetry() {
    spinner.style.display = "none";
    loadingText.textContent = "Erro ao carregar desafio.";
    retryBtn.style.display = "inline-block";
}


/**
 * Realiza o registro do usuário, salva a lista de desafios e o player/telefone no localStorage.
 * @param {function} callback
 */
function register(callback) {
    const reference = params.get("reference") || 0;
    // Prioriza tagID salvo pelo modal, se existir
    const tagID = window._tagDoCaosTagID || params.get("tagID") || 0;
    const nickName = document.getElementById("modal-nickname").value.trim();
    const phone = document.getElementById("modal-phone").value.trim();

    const newParams = new URLSearchParams({
        reference: reference,
        tagID: tagID,
        nickName: nickName,
        phone: phone,
    });
    const googleScriptURL = `${url}?${newParams.toString()}`;
    showLoading();
    fetch(googleScriptURL)
        .then((res) => res.json())
        .then((data) => {
            console.log('Resposta do registro:', data);
            if (data && data.challengeList) {
                saveToLocalStorage('challengeList', data.challengeList);
            }
            // Salva player e telefone no localStorage
            if (data && data.player) {
                saveToLocalStorage('player', data.player);
                if (data.player.phone) {
                    saveToLocalStorage('playerphone', data.player.phone);
                } else {
                    saveToLocalStorage('playerphone', phone);
                }
            } else {
                // fallback: salva nickname e phone mesmo sem player
                saveToLocalStorage('player', { nickname: nickName, phone: phone });
                saveToLocalStorage('playerphone', phone);
            }
            if (data.status && typeof callback === 'function') {
                callback(data);
                hideLoading(); // Loading só some após cadastro
            } else {
                alert('Não foi possível registrar. Resposta: ' + JSON.stringify(data));
            }
        })
        .catch((err) => {
            console.error('Erro no registro:', err);
            showRetry();
        });
}


// =====================
//  HANDLERS DE FORMULÁRIOS E HOME
// =====================

/**
 * Handler para formulários de cadastro, recuperação e home.
 */
document.addEventListener("DOMContentLoaded", function () {
    const modalCustomOk = document.getElementById("modal-custom-ok");
    if (modalCustomOk) {
        modalCustomOk.addEventListener("click", function () {
            const nicknameInput = document.getElementById("modal-nickname");
            const phoneInput = document.getElementById("modal-phone");
            const nickname = nicknameInput.value.trim();
            // Remove tudo que não for número
            phoneInput.value = phoneInput.value.replace(/\D/g, "");
            const phone = phoneInput.value;
            const errorDiv = document.getElementById("modal-custom-error");
            let errorMsg = "";
            // Reset estilos
            nicknameInput.style.borderColor = "#ccc";
            phoneInput.style.borderColor = "#ccc";
            if (!nickname) {
                errorMsg = "Por favor, preencha o nickname.";
                nicknameInput.style.borderColor = "#c00";
            }
            if (!/^\d{11}$/.test(phone)) {
                if (errorMsg) errorMsg += " ";
                errorMsg +=
                    "O telefone deve conter exatamente 11 números (incluindo DDD).";
                phoneInput.style.borderColor = "#c00";
            }
            if (errorDiv) errorDiv.textContent = errorMsg;
            if (errorMsg) return;
            errorDiv.textContent = "";
            register(function (data) {
                if (data && data.challengeList) {
                    saveToLocalStorage('challengeList', data.challengeList);
                    hideModalCustom();
                    showHome(data.player.nickname, data.player.score, data.player.skipPoints);
                } else {
                    hideModalCustom();
                    showHome(nickname, 0, 3);
                }
            });
        });
    }
    const phoneInput = document.getElementById("modal-phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function (e) {
            this.value = this.value.replace(/\D/g, "");
        });
    }
    // Modal Parabéns OK fecha o modal e vai para home
    const modalParabensOk = document.getElementById('modal-parabens-ok');
    if (modalParabensOk) {
        modalParabensOk.addEventListener('click', function () {
            document.getElementById('modal-parabens').style.display = 'none';
            showHome(nickname, score, skipPoints);
        });
    }

    // Lógica para alternar entre os formulários do modal customizado
    const btnNovo = document.getElementById("modal-custom-new");
    const btnRecuperar = document.getElementById("modal-custom-recover");
    const formNovo = document.getElementById("modal-custom-form-new");
    const formRecuperar = document.getElementById("modal-custom-form-recover");
    const options = document.getElementById("modal-custom-options");

    if (btnNovo && btnRecuperar && formNovo && formRecuperar && options) {
        btnNovo.addEventListener("click", function () {
            options.style.display = "none";
            formNovo.style.display = "block";
            formRecuperar.style.display = "none";
        });
        btnRecuperar.addEventListener("click", function () {
            // Se já existe player e playerphone no localStorage, faz a requisição automática
            const player = getFromLocalStorage('player');
            const playerphone = getFromLocalStorage('playerphone');
            if (player && playerphone) {
                // Chama a API automaticamente para recuperar pontuação usando o telefone do localStorage
                const reference = params.get("reference") || 0;
                const tagID = window._tagDoCaosTagID || params.get("tagID") || 0;
                const phoneValue = playerphone.value || playerphone;
                const newParams = new URLSearchParams({
                    reference: reference,
                    tagID: tagID,
                    nickName: player.nickname || "none",
                    phone: phoneValue
                });
                const googleScriptURL = `${url}?${newParams.toString()}`;
                showModalCustom("Recuperando pontuação...");
                showLoading();
                fetch(googleScriptURL)
                    .then((res) => res.json())
                    .then((data) => {
                        // Salva player e telefone recuperados
                        if (data && data.player) {
                            saveToLocalStorage('player', data.player);
                            if (data.player.phone) {
                                saveToLocalStorage('playerphone', data.player.phone);
                            } else {
                                saveToLocalStorage('playerphone', phoneValue);
                            }
                        }
                        hideModalCustom();
                        let nickname = (data.player && data.player.nickname) ? data.player.nickname : '';
                        let score = (data.player && data.player.score) ? data.player.score : '';
                        let skipPoints = (data.player && data.player.skipPoints) ? data.player.skipPoints : '';
                        showHome(nickname, score, skipPoints);
                    })
                    .catch((err) => {
                        hideModalCustom();
                        showHome('', '', 0, { error: 'Erro ao recuperar pontuação.' });
                    });
            } else {
                // Se não tem dados, mostra o campo para digitar telefone normalmente
                options.style.display = "none";
                formNovo.style.display = "none";
                formRecuperar.style.display = "block";
            }
        });
    }

    // Botão OK do recuperar pontuação
    const btnOkRecuperar = document.getElementById("modal-custom-ok-recover");
    if (btnOkRecuperar) {
        btnOkRecuperar.addEventListener("click", function () {
            showLoading();
            const phoneInput = document.getElementById("modal-phone-recover");
            phoneInput.value = phoneInput.value.replace(/\D/g, "");
            const phone = phoneInput.value;
            const errorDiv = document.getElementById("modal-custom-error");
            let errorMsg = "";
            phoneInput.style.borderColor = "#ccc";
            if (!/^\d{11}$/.test(phone)) {
                errorMsg = "O telefone deve conter exatamente 11 números (incluindo DDD).";
                phoneInput.style.borderColor = "#c00";
            }
            if (errorDiv) errorDiv.textContent = errorMsg;
            if (errorMsg) return;
            errorDiv.textContent = "";
            // Chama a API passando apenas o telefone
            const reference = params.get("reference") || 0;
            const tagID = window._tagDoCaosTagID || params.get("tagID") || 0;
            const newParams = new URLSearchParams({
                reference: reference,
                tagID: tagID,
                nickName: "none",
                phone: phone
            });
            const googleScriptURL = `${url}?${newParams.toString()}`;
            fetch(googleScriptURL)
                .then((res) => res.json())
                .then((data) => {
                    // Salva player e telefone recuperados
                    if (data && data.player) {
                        saveToLocalStorage('player', data.player);
                        if (data.player.phone) {
                            saveToLocalStorage('playerphone', data.player.phone);
                        } else {
                            saveToLocalStorage('playerphone', phone);
                        }
                    }
                    hideModalCustom();
                    let nickname = (data.player && data.player.nickname) ? data.player.nickname : '';
                    let score = (data.player && data.player.score) ? data.player.score : '';
                    let skipPoints = (data.player && data.player.skipPoints) ? data.player.skipPoints : '';
                    showHome(nickname, score, skipPoints);
                })
                .catch((err) => {
                    hideModalCustom();
                    showHome('', '', 0, { error: 'Erro ao recuperar pontuação.' });
                });
        });
    }

    // Botão da home para ir para os desafios
    const btnIrDesafio = document.getElementById('btn-ir-desafio');
    if (btnIrDesafio) {
        btnIrDesafio.addEventListener('click', function () {
            document.getElementById('homeContent').style.display = 'none';
            document.getElementById('mainContent').style.display = 'flex';
        });
    }

    /**
     * Exibe a tela home personalizada com nickname e score.
     * @param {string} nickname
     * @param {string|number} score
     * @param {object} data
     */
    window.showHome = function(nickname, score, skipPoints, data) {
        showBoxLoading('player-box', "Carregando dados do jogador..."); // Mostra imediatamente
        showBoxLoading('ranking-box', "Carregando ranking..."); // Mostra imediatamente
        // Busca player atualizado antes de exibir a home
        const playerphone = getFromLocalStorage('playerphone');
        const phone = playerphone && playerphone.value ? playerphone.value : playerphone;
        if (phone) {
            fetchPlayer(phone).then(player => {
                // Atualiza dados com o player mais recente
                let nome = (player && player.nickname) ? player.nickname : (typeof nickname === 'string' && nickname.trim() ? nickname : 'Visitante');
                let pontos = (player && typeof player.score !== 'undefined') ? player.score : (typeof score === 'number' && !isNaN(score) ? score : (parseInt(score) || 0));
                let skips = (player && typeof player.skipPoints !== 'undefined') ? player.skipPoints : (typeof skipPoints === 'number' && !isNaN(skipPoints) ? skipPoints : (parseInt(skipPoints) || 0));
                // Exibe a home
                document.getElementById('mainContent').style.display = 'none';
                document.getElementById('homeContent').style.display = 'flex';
                var loading = document.getElementById('loading');
                if (loading) loading.style.display = 'none';
                const nicknameLine = document.getElementById('home-nickname');
                const scoreLine = document.getElementById('home-score');
                const skipPointsLine = document.getElementById('home-skip-points');
                const extra = document.getElementById('home-extra');
                if (data && data.error) {
                    nicknameLine.textContent = 'erro';
                    scoreLine.innerHTML = `<span style='color:#c00;'>${data.error}</span>`;
                    skipPointsLine.innerHTML = 'erro';
                    extra.innerHTML = 'erro';
                } else {
                    nicknameLine.textContent = nome;
                    scoreLine.innerHTML = `<b>${pontos}</b> pontos`;
                    skipPointsLine.innerHTML = `<b>${skips}</b> chances de arrego`;
                    extra.innerHTML = '';
                }
                // Busca e exibe ranking
                const rankingList = document.getElementById('ranking-list');
                if (rankingList) {
                    rankingList.innerHTML = '<li style="color:#aaa;">Carregando ranking...</li>';
                    let ranking = (data && data.ranking) ? data.ranking : null;
                    if (ranking && Array.isArray(ranking)) {
                        updateRankingDisplay(ranking, phone);
                    } else {
                        fetchRanking(400).then(ranking => {
                            updateRankingDisplay(ranking, phone);
                        });
                    }
                }
            });
            return;
        }
        // Caso não tenha telefone, exibe home com dados recebidos
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('homeContent').style.display = 'flex';
        var loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        const nicknameLine = document.getElementById('home-nickname');
        const scoreLine = document.getElementById('home-score');
        const skipPointsLine = document.getElementById('home-skip-points');
        const extra = document.getElementById('home-extra');
        let nome = (typeof nickname === 'string' && nickname.trim()) ? nickname : 'Visitante';
        let pontos = (typeof score === 'number' && !isNaN(score)) ? score : (parseInt(score) || 0);
        let skips = (typeof skipPoints === 'number' && !isNaN(skipPoints)) ? skipPoints : (parseInt(skipPoints) || 0);
        if (data && data.error) {
            nicknameLine.textContent = 'erro';
            scoreLine.innerHTML = `<span style='color:#c00;'>${data.error}</span>`;
            skipPointsLine.innerHTML = 'erro';
            extra.innerHTML = 'erro';
        } else {
            nicknameLine.textContent = nome;
            scoreLine.innerHTML = `<b>${pontos}</b> pontos`;
            skipPointsLine.innerHTML = `<b>${skips}</b> chances de arrego`;
            extra.innerHTML = '';
        }
        // Busca e exibe ranking
        const rankingList = document.getElementById('ranking-list');
        if (rankingList) {
            rankingList.innerHTML = '<li style="color:#aaa;">Carregando ranking...</li>';
            let ranking = (data && data.ranking) ? data.ranking : null;
            if (ranking && Array.isArray(ranking)) {
                updateRankingDisplay(ranking, '');
            } else {
                fetchRanking(400).then(ranking => {
                    updateRankingDisplay(ranking, '');
                });
            }
        }
    }

    // Botão OK do novo participante
    const btnOkNovo = document.getElementById("modal-custom-ok-new");
    if (btnOkNovo) {
        btnOkNovo.addEventListener("click", function () {
            const nicknameInput = document.getElementById("modal-nickname");
            const phoneInput = document.getElementById("modal-phone");
            const nickname = nicknameInput.value.trim();
            phoneInput.value = phoneInput.value.replace(/\D/g, "");
            const phone = phoneInput.value;
            const errorDiv = document.getElementById("modal-custom-error");
            let errorMsg = "";
            nicknameInput.style.borderColor = "#ccc";
            phoneInput.style.borderColor = "#ccc";
            if (!nickname) {
                errorMsg = "Por favor, preencha o nickname.";
                nicknameInput.style.borderColor = "#c00";
            }
            if (!/^\d{11}$/.test(phone)) {
                if (errorMsg) errorMsg += " ";
                errorMsg += "O telefone deve conter exatamente 11 números (incluindo DDD).";
                phoneInput.style.borderColor = "#c00";
            }
            if (errorDiv) errorDiv.textContent = errorMsg;
            if (errorMsg) return;
            errorDiv.textContent = "";
            register(function () {
                hideModalCustom();
                const modalParabens = document.getElementById('modal-parabens');
                const msgParabens = document.getElementById('modal-parabens-message');
                msgParabens.textContent = `Parabéns ${nickname}! Agora você já pode participar dos desafios!`;
                modalParabens.style.display = 'flex';
            });
        });
    }
});
