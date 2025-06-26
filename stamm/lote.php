<?php
// URL da planilha publicada como CSV
$url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHRMwVh-s3otYgaFoLhRzj7h3f-oyF8Dojf3fc6Pqlf1AX-fS3CqrNuspRRd5MQNb7x1DK6KfiO5pQ/pub?gid=736107426&single=true&output=csv";

// Obtém conteúdo da planilha
$csv = file_get_contents($url);

// Converte para array
$linhas = array_map("str_getcsv", explode("\n", $csv));

// Pega cabeçalhos e última linha válida
$headers = array_map('trim', $linhas[0]);
debug_to_console($headers);
$ultimaLinha = $linhas[count($linhas) - 2]; // penúltima, já que a última costuma estar vazia
debug_to_console($ultimaLinha);
// Converte para array associativo
$resposta = array_combine($headers, $ultimaLinha);

// Retorna o valor da coluna "Lote"
header('Content-Type: application/json');
echo json_encode(["lote" => $resposta["Lote"]]);


function debug_to_console($data) {
    $output = $data;
    if (is_array($output))
        $output = implode(',', $output);

    echo "<script>console.log('Debug Objects: " . $output . "' );</script>";
}
