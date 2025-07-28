const url = `https://script.google.com/macros/s/AKfycbw4J-9Dy2b40QAMJvulXZ-YdZPpb3sIYn3Jz36PN0iWr92zV47FHruQJjP2rj7DkgHY/exec`;
const params = new URLSearchParams(window.location.search);

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
            window.open("https://www.instagram.com", "_blank");
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const loading = document.getElementById("loading");
    const mainContent = document.getElementById("mainContent");
    const spinner = document.getElementById("spinner");
    const loadingText = document.getElementById("loading-text");
    const retryBtn = document.getElementById("retry-btn");

    function showLoading() {
        loading.style.display = "flex";
        spinner.style.display = "block";
        loadingText.style.display = "block";
        retryBtn.style.display = "none";
    }
    function showRetry() {
        spinner.style.display = "none";
        loadingText.textContent = "Erro ao carregar desafio.";
        retryBtn.style.display = "inline-block";
    }
    function hideLoading() {
        loading.style.display = "none";
        mainContent.style.display = "flex";
    }

    function fetchChallenge() {
        showLoading();
        const reference = params.get("reference") || 0;
        const tagID = params.get("tagID") || 0;
        const newParams = new URLSearchParams({
            reference: reference,
            tagID: tagID,
        });
        const googleScriptURL = `${url}?${newParams.toString()}`;
        fetch(googleScriptURL)
            .then((res) => res.json())
            .then((data) => {
                if (data.newParticipant) {
                    showModalCustom(
                        "Você é um novo participante! Boa sorte nos desafios!"
                    );
                }
                const desafio = document.querySelector("#challenge span");
                const consequencia = document.querySelector("#description span");
                const footer = document.querySelector("#footer");

                desafio.textContent = data.challenge || "Erro ao carregar";
                consequencia.textContent = data.description || "Erro ao carregar";
                footer.style.display = data.shareable ? "flex" : "none";
                hideLoading();
            })
            .catch(() => {
                showRetry();
            });
    }
    retryBtn.addEventListener("click", function () {
        loadingText.textContent = "Carregando desafio...";
        fetchChallenge();
    });

    fetchChallenge();
});

function showModalCustom(message) {
    const modal = document.getElementById("modal-custom");
    const msg = document.getElementById("modal-custom-message");
    msg.textContent = message || "Mensagem customizada";
    modal.style.display = "flex";
}

function hideModalCustom() {
    document.getElementById("modal-custom").style.display = "none";
}

function showRetry() {
    spinner.style.display = "none";
    loadingText.textContent = "Erro ao carregar desafio.";
    retryBtn.style.display = "inline-block";
}

function register(callback) {
    const reference = params.get("reference") || 0;
    const tagID = params.get("tagID") || 0;
    const nickName = document.getElementById("modal-nickname").value.trim();
    const phone = document.getElementById("modal-phone").value.trim();

    const newParams = new URLSearchParams({
        reference: reference,
        tagID: tagID,
        nickName: nickName,
        phone: phone,
    });
    const googleScriptURL = `${url}?${newParams.toString()}`;
    fetch(googleScriptURL)
        .then((res) => res.json())
        .then((data) => {
            console.log('Resposta do registro:', data);
            if (data.status && typeof callback === 'function') {
                callback();
            } else {
                alert('Não foi possível registrar. Resposta: ' + JSON.stringify(data));
            }
        })
        .catch((err) => {
            console.error('Erro no registro:', err);
            showRetry();
        });
}

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
            register(function() {
                hideModalCustom();
                const modalParabens = document.getElementById('modal-parabens');
                const msgParabens = document.getElementById('modal-parabens-message');
                msgParabens.textContent = `Parabéns ${nickname}! Agora você já pode participar dos desafios!`;
                modalParabens.style.display = 'flex';
            });
        });
    }
    const phoneInput = document.getElementById("modal-phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function (e) {
            this.value = this.value.replace(/\D/g, "");
        });
    }
    // Modal Parabéns OK fecha o modal
    const modalParabensOk = document.getElementById('modal-parabens-ok');
    if (modalParabensOk) {
        modalParabensOk.addEventListener('click', function() {
            document.getElementById('modal-parabens').style.display = 'none';
        });
    }
});
