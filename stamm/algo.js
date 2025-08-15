/**
 * CONFIGURAÇÕES DE PLANILHAS
 */
const mainDataSet = SpreadsheetApp.openById("14K3ThUYyQyv39s7niGIr51b1oViucn2CKpGG66yNj9E");
const playerSheet = mainDataSet.getSheetByName("player");
const qrPlayerSheet = mainDataSet.getSheetByName("qr_player");
const challengeDataSet = mainDataSet.getSheetByName("desafios");

/**
 * ENDPOINT PRINCIPAL COM ROTEAMENTO POR PARÂMETRO "function"
 */
function doGet(e) {
  e = e || { parameter: {} };

  // Normaliza requestedFunction
  const requestedFunction = (e.parameter.function_ || "").toString().trim();

  if (requestedFunction) {
    Logger.log("doGet routed to function: " + requestedFunction);
    switch (requestedFunction) {
      case "acceptChallenge":
        return acceptChallenge(e);
      case "skipChallenge":
        return skipChallenge(e);
      case "getRanking":
        return getRankingEndpoint(e);
      case "getPlayer":
        return getPlayerEndpoint(e);
      default:
        return jsonResponse({ error: "Função desconhecida: " + requestedFunction });
    }
  }
/**
 * Endpoint para buscar player pelo telefone
 */
function getPlayerEndpoint(e) {
  const phone = (e.parameter.phone || "").toString().trim();
  if (!phone) {
    return jsonResponse({ error: "Parâmetro 'phone' obrigatório" });
  }
  const player = getPlayerByPhone(phone);
  if (!player) {
    return jsonResponse({ error: "Player não encontrado" });
  }
  return jsonResponse({ status: "player_found", player });
}

  // Sem função específica -> mantém fluxo padrão
  return defaultFlow(e);
}

/**
 * FLUXO ANTIGO INTACTO (mas corrigido: verifica QR primeiro sempre)
 */
function defaultFlow(e) {
  // Normaliza parâmetros
  const tagID = (e.parameter.tagID || "").toString().trim();
  const nickname = (e.parameter.nickName || "").toString().trim();
  const phone = (e.parameter.phone || "").toString().trim();
  const reference = (e.parameter.reference || "").toString().trim(); // pode ser "1".."5" ou ""

  Logger.log("defaultFlow called with tagID=%s phone=%s nick=%s reference=%s", tagID, phone, nickname, reference);

  if (!tagID) {
    return jsonResponse({ error: "tagID obrigatório" });
  }

  try {
    // 1) Verifica vínculo do QR com player IMEDIATAMENTE
    const qrLink = getQrLink(tagID);
    Logger.log("qrLink lookup for tagID=%s -> %s", tagID, JSON.stringify(qrLink));

    // 2) Se o QR não tem vínculo, então tentamos registrar (se vier phone+nick) ou sinalizamos needs_registration.
    if (!qrLink) {
      Logger.log("QR sem vínculo.");
      if (phone && nickname) {
        Logger.log("Tentando registrar ou reusar player phone=%s", phone);

        let player = getPlayerByPhone(phone);

        if (!player) {
          Logger.log("Player não existe. Registrando novo player para phone=%s", phone);
          player = registerPlayer({
            phone,
            nickname,
            score: 0,
            skipPoints: 3,
            lastChallengerPhone: ""
          });
        } else {
          Logger.log("Player já existe. Não atualiza nickname (policy). player=%s", JSON.stringify(player));
        }

        // Atualiza vínculo QR -> phone. Se já existia vínculo para esse phone, atualiza a linha.
        let existingQrRow = findQrByPhone(phone);
        if (existingQrRow) {
          Logger.log("Atualizando vínculo existente para phone=%s na linha %s com tagID=%s", phone, existingQrRow, tagID);
          qrPlayerSheet.getRange(existingQrRow, 1).setValue(tagID);
        } else {
          Logger.log("Criando novo vínculo QR->phone: %s -> %s", tagID, phone);
          linkQrToPlayer(tagID, phone);
        }

        return jsonResponse({ status: "player_registered_or_updated", player });
      }

      // Se não vier phone+nick: informar ao cliente que precisa abrir tela de cadastro
      Logger.log("QR sem vínculo e sem dados de registro -> needs_registration");
      return jsonResponse({ status: "needs_registration", tagID: tagID });
    }

    // 3) Se temos vínculo, pegamos o player do phone vinculado
    const player = getPlayerByPhone(qrLink.phone);
    if (!player) {
      Logger.log("Vínculo existe, mas player não encontrado para phone=%s", qrLink.phone);
      return jsonResponse({ error: "Player não encontrado" });
    }

    // 4) Só agora consideramos reference (já temos player e vínculo)
    if (reference) {
      Logger.log("Retornando challengeList para reference=%s", reference);
      const challengeList = getChallenge(reference);
      return jsonResponse({ status: "challengeList", challengeList, player });
    }

    // 5) Sem reference -> apenas retornamos dados do player
    return jsonResponse({ status: "player_found", player });

  } catch (err) {
    Logger.log("Erro em defaultFlow: " + err.toString());
    return jsonResponse({ error: err.toString() });
  }
}

/**
 * AÇÕES: acceptChallenge / skipChallenge (roteadas via ?function_=...)
 * Corrigidas para resolver challengedPhone via tagID e consertar penalidade.
 */
function acceptChallenge(e) {
  const challengerPhone = (e.parameter.challengerPhone || "").toString().trim();
  const tagID = (e.parameter.tagID || "").toString().trim();
  const points = parseInt(e.parameter.points, 10) || 0;

  Logger.log("acceptChallenge called: challenger=%s tagID=%s points=%s", challengerPhone, tagID, points);

  if (!challengerPhone || !tagID) {
    return jsonResponse({ error: "challengerPhone e tagID são obrigatórios" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const challenger = getPlayerByPhone(challengerPhone);
    if (!challenger) {
      return jsonResponse({ error: "Challenger não encontrado" });
    }

    // Resolve challengedPhone pelo tagID (getQrLink retorna objeto com .phone)
    const qr = getQrLink(tagID);
    if (!qr || !qr.phone) {
      return jsonResponse({ error: "Challenged não encontrado para este tagID" });
    }
    const challengedPhone = String(qr.phone).trim();

    const challenged = getPlayerByPhone(challengedPhone);
    if (!challenged) {
      return jsonResponse({ error: "Player desafiado não encontrado" });
    }

    // Aplicar pontos (soma ao desafiado)
    challenged.score = Number(challenged.score || 0) + Number(points || 0);
    challenged.lastChallengerPhone = challengerPhone;
    updatePlayer(challenged);

    Logger.log("acceptChallenge applied: challenged=%s newScore=%s", challengedPhone, challenged.score);

    return jsonResponse({
      status: "challenge_accepted",
      challenged: challengedPhone,
      points: points,
      player: challenged
    });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function skipChallenge(e) {
  const challengerPhone = (e.parameter.challengerPhone || "").toString().trim();
  const tagID = (e.parameter.tagID || "").toString().trim();
  // penalty points: optional param 'points', otherwise default 5
  const penaltyParam = parseInt(e.parameter.points, 10);
  const penaltyPoints = (Number.isInteger(penaltyParam) && penaltyParam > 0) ? penaltyParam : 5;

  Logger.log("skipChallenge called: challenger=%s tagID=%s penalty=%s", challengerPhone, tagID, penaltyPoints);

  if (!challengerPhone || !tagID) {
    return jsonResponse({ error: "challengerPhone e tagID são obrigatórios" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    // Resolve challengedPhone via tagID
    const qr = getQrLink(tagID);
    if (!qr || !qr.phone) {
      return jsonResponse({ error: "Challenged não encontrado para este tagID" });
    }
    const challengedPhone = String(qr.phone).trim();

    const challenged = getPlayerByPhone(challengedPhone);
    if (!challenged) {
      return jsonResponse({ error: "Player desafiado não encontrado" });
    }

    // Lógica de skips: se tiver skipPoints > 0, decrementa; se 0, aplica penalidade e reseta skipPoints=2
    const sp = Number(challenged.skipPoints || 0);
    if (sp > 0) {
      challenged.skipPoints = sp - 1;
      Logger.log("skipChallenge: decremented skipPoints to %s for %s", challenged.skipPoints, challengedPhone);
    } else {
      // aplica penalidade (subtrai pontos) e reseta skipPoints
      challenged.score = Number(challenged.score || 0) - Number(penaltyPoints);
      challenged.skipPoints = 1;
      Logger.log("skipChallenge: applied penalty. newScore=%s skipPoints reset to 2 for %s", challenged.score, challengedPhone);
    }

    // registrar quem foi o desafiante
    challenged.lastChallengerPhone = challengerPhone;
    updatePlayer(challenged);

    return jsonResponse({
      status: "challenge_skipped",
      challenged: challengedPhone,
      points: penaltyPoints,
      player: challenged
    });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * FUNÇÕES AUXILIARES EXISTENTES
 */
function getQrLink(tagID) {
  if (!tagID) return false;
  const data = qrPlayerSheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() == String(tagID).trim()) {
      return { tagID: data[i][0], phone: data[i][1], rowPosition: i + 1 };
    }
  }
  return false;
}

function findQrByPhone(phone) {
  if (!phone) return false;
  const data = qrPlayerSheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() == String(phone).trim()) {
      return i + 1;
    }
  }
  return false;
}

function getPlayerByPhone(phone) {
  if (!phone) return false;
  const data = playerSheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() == String(phone).trim()) {
      return {
        phone: String(data[i][0]).trim(),
        nickname: data[i][1],
        score: Number(data[i][2] || 0),
        skipPoints: Number(data[i][3] || 0),
        lastChallengerPhone: data[i][4],
        rowPosition: i + 1
      };
    }
  }
  return false;
}

function registerPlayer(data) {
  playerSheet.appendRow([
    data.phone,
    data.nickname,
    data.score,
    data.skipPoints,
    data.lastChallengerPhone
  ]);
  return getPlayerByPhone(data.phone);
}

function updatePlayer(playerData) {
  if (!playerData || !playerData.rowPosition) {
    throw new Error("updatePlayer: playerData.rowPosition required");
  }
  playerSheet.getRange(playerData.rowPosition, 1, 1, 5).setValues([[
    playerData.phone,
    playerData.nickname,
    playerData.score,
    playerData.skipPoints,
    playerData.lastChallengerPhone
  ]]);
  return { status: "player_updated", row: playerData.rowPosition };
}

function linkQrToPlayer(tagID, phone) {
  qrPlayerSheet.appendRow([tagID, phone]);
  return { status: "qr_linked", tagID, phone };
}

function getChallenge(reference) {
  const startRow = 2;
  const lastRow = challengeDataSet.getLastRow();

  const mapping = {
    1: [1, 2, 3, 4],
    2: [5, 6, 7, 8],
    3: [9, 10, 11, 12],
    4: [13, 14, 15, 16],
    5: [17, 18, 19, 20]
  };

  const challengeList = {};
  for (let group = 1; group <= 5; group++) {
    const cols = mapping[group];
    const values = challengeDataSet.getRange(startRow, cols[0], Math.max(0, lastRow - startRow + 1), cols.length).getValues();
    challengeList[group] = values.map(row => ({
      challenge: row[0],
      description: row[1],
      shareable: row[2],
      points: row[3]
    }));
  }
  return challengeList;
}

/**
 * FUNÇÃO DE RANKING - Adicionar no Google Apps Script
 */

/**
 * Retorna o ranking dos jogadores ordenado por score (maior para menor)
 * @param {number} limit - Número máximo de jogadores no ranking (padrão: 10)
 * @returns {Array} Array com objetos {position, nickname, score, phone}
 */
function getRanking(limit = 400) {
  try {
    const data = playerSheet.getDataRange().getValues();
    
    // Remove o cabeçalho (primeira linha) se existir
    const players = data.slice(1).map(row => ({
      phone: String(row[0]).trim(),
      nickname: row[1] || 'Player',
      score: Number(row[2] || 0),
      skipPoints: Number(row[3] || 0),
      lastChallengerPhone: row[4] || ''
    }));
    
    // Filtra apenas jogadores com score > 0 (opcional)
    // const activePlayers = players.filter(player => player.score > 0);
    
    // Ordena por score (maior para menor)
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
    
    // Limita o número de jogadores e adiciona posição
    const ranking = sortedPlayers.slice(0, limit).map((player, index) => ({
      position: index + 1,
      nickname: player.nickname,
      score: player.score,
      phone: player.phone // inclui phone para identificar o player atual
    }));
    
    return ranking;
    
  } catch (error) {
    Logger.log('Erro ao gerar ranking: ' + error.toString());
    return [];
  }
}

/**
 * NOVA FUNÇÃO DE ENDPOINT PARA RANKING
 * Adicionar este case no switch do doGet():
 */
function getRankingEndpoint(e) {
  const limit = parseInt(e.parameter.limit, 10) || 10;
  
  try {
    const ranking = getRanking(limit);
    return jsonResponse({
      status: "ranking_success",
      ranking: ranking,
      total: ranking.length
    });
  } catch (error) {
    Logger.log('Erro no endpoint de ranking: ' + error.toString());
    return jsonResponse({
      error: "Erro ao buscar ranking: " + error.toString()
    });
  }
}

/**
 * RESPOSTA JSON PADRÃO
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
