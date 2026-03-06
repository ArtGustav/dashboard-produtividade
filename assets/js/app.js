const CONFIG_STORAGE_KEY = "tarefas"; // o usuario pode trocar para "protocolos"

const estado = {
  graficos: {
    status: null,
    prioridade: null,
    linha: null
  }
};

document.addEventListener("DOMContentLoaded", iniciarPainel);

function iniciarPainel() {
  const botaoAtualizar = document.getElementById("btn-atualizar");
  const botaoSeed = document.getElementById("btn-seed");

  botaoAtualizar.addEventListener("click", atualizarPainel);
  botaoSeed.addEventListener("click", function () {
    const dadosSeed = gerarSeed();
    salvarDados(dadosSeed);
    atualizarPainel();
    mostrarMensagem("Dados de exemplo gerados com sucesso.", "sucesso");
  });

  let dados = carregarDados();
  if (dados.length === 0) {
    dados = gerarSeed();
    salvarDados(dados);
    mostrarMensagem("Nenhum dado encontrado. Dados de exemplo criados automaticamente.", "info");
  }

  atualizarPainel();
}

function atualizarPainel() {
  const seletorPeriodo = document.getElementById("periodo");
  const periodoSelecionado = seletorPeriodo.value;

  let dadosBrutos = carregarDados();
  if (dadosBrutos.length === 0) {
    dadosBrutos = gerarSeed();
    salvarDados(dadosBrutos);
  }

  const dadosNormalizados = normalizarDados(dadosBrutos);
  const dadosFiltrados = filtrarPorPeriodo(dadosNormalizados, periodoSelecionado);
  const metricas = calcularMetricas(dadosFiltrados);

  renderizarCards(metricas);
  renderizarTabela(dadosFiltrados);
  renderizarGraficos(dadosFiltrados, periodoSelecionado);
  atualizarMensagemEstado(dadosNormalizados.length, dadosFiltrados.length, periodoSelecionado);
}

function carregarDados() {
  const valorSalvo = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!valorSalvo) {
    return [];
  }

  try {
    const dados = JSON.parse(valorSalvo);
    if (Array.isArray(dados)) {
      return dados;
    }
    return [];
  } catch (erro) {
    console.error("Falha ao ler dados do localStorage:", erro);
    return [];
  }
}

function salvarDados(dados) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dados));
}

function gerarSeed() {
  const quantidade = 42;
  const opcoesStatus = ["pendente", "andamento", "concluido", "concluida"];
  const opcoesPrioridade = ["baixa", "media", "média", "alta"];
  const dados = [];
  const hoje = new Date();

  for (let i = 0; i < quantidade; i += 1) {
    const dataItem = new Date(hoje);
    dataItem.setDate(hoje.getDate() - numeroAleatorio(0, 89));
    dataItem.setHours(numeroAleatorio(7, 22), numeroAleatorio(0, 59), 0, 0);

    const item = {
      id: "item-" + Date.now() + "-" + i,
      status: opcoesStatus[numeroAleatorio(0, opcoesStatus.length - 1)],
      prioridade: opcoesPrioridade[numeroAleatorio(0, opcoesPrioridade.length - 1)]
    };

    if (i % 2 === 0) {
      item.titulo = "Tarefa " + (i + 1);
    } else {
      item.assunto = "Protocolo " + (i + 1);
    }

    if (i % 3 === 0) {
      item.criadaEm = dataItem.toISOString();
    } else {
      item.criadoEm = dataItem.toISOString();
    }

    dados.push(item);
  }

  return dados;
}

function normalizarDados(dadosBrutos) {
  const dadosNormalizados = [];

  for (let i = 0; i < dadosBrutos.length; i += 1) {
    const item = dadosBrutos[i] || {};
    const tituloOuAssunto = extrairTituloOuAssunto(item, i);

    const dataNormalizada = normalizeData(item.criadaEm || item.criadoEm || item.data);

    dadosNormalizados.push({
      tituloOuAssunto: tituloOuAssunto,
      status: normalizeStatus(item.status),
      prioridade: normalizePrioridade(item.prioridade),
      data: dataNormalizada
    });
  }

  return dadosNormalizados;
}

function normalizeStatus(status) {
  if (typeof status !== "string") {
    return "pendente";
  }

  const texto = limparTexto(status);
  if (texto.indexOf("andamento") !== -1 || texto.indexOf("em andamento") !== -1) {
    return "andamento";
  }
  if (texto.indexOf("concluid") !== -1) {
    return "concluido";
  }
  if (texto.indexOf("pendent") !== -1) {
    return "pendente";
  }

  return "pendente";
}

function normalizePrioridade(prioridade) {
  if (typeof prioridade !== "string") {
    return "baixa";
  }

  const texto = limparTexto(prioridade);
  if (texto.indexOf("alta") !== -1) {
    return "alta";
  }
  if (texto.indexOf("medi") !== -1) {
    return "media";
  }
  if (texto.indexOf("baix") !== -1) {
    return "baixa";
  }

  return "baixa";
}

function normalizeData(data) {
  if (data instanceof Date && !isNaN(data.getTime())) {
    return new Date(data);
  }

  if (typeof data === "string" || typeof data === "number") {
    const dataConvertida = new Date(data);
    if (!isNaN(dataConvertida.getTime())) {
      return dataConvertida;
    }
  }

  // Fallback para manter o item visivel mesmo quando a origem nao traz data valida.
  return new Date();
}

function filtrarPorPeriodo(dados, periodo) {
  if (periodo === "todos") {
    return dados.slice();
  }

  const dias = periodo === "30" ? 30 : 7;
  const dataLimite = new Date();
  dataLimite.setHours(0, 0, 0, 0);
  dataLimite.setDate(dataLimite.getDate() - (dias - 1));

  const filtrados = [];
  for (let i = 0; i < dados.length; i += 1) {
    const dataItem = new Date(dados[i].data);
    dataItem.setHours(0, 0, 0, 0);
    if (dataItem >= dataLimite) {
      filtrados.push(dados[i]);
    }
  }

  return filtrados;
}

function calcularMetricas(dados) {
  const metricas = {
    total: 0,
    pendentes: 0,
    andamento: 0,
    concluidos: 0,
    altaPrioridade: 0
  };

  for (let i = 0; i < dados.length; i += 1) {
    const item = dados[i];
    metricas.total += 1;

    if (item.status === "pendente") {
      metricas.pendentes += 1;
    } else if (item.status === "andamento") {
      metricas.andamento += 1;
    } else if (item.status === "concluido") {
      metricas.concluidos += 1;
    }

    if (item.prioridade === "alta") {
      metricas.altaPrioridade += 1;
    }
  }

  return metricas;
}

function montarDatasetStatus(dados) {
  const contagem = {
    pendente: 0,
    andamento: 0,
    concluido: 0
  };

  for (let i = 0; i < dados.length; i += 1) {
    const status = dados[i].status;
    if (status === "pendente") {
      contagem.pendente += 1;
    } else if (status === "andamento") {
      contagem.andamento += 1;
    } else if (status === "concluido") {
      contagem.concluido += 1;
    }
  }

  return {
    labels: ["Pendentes", "Em andamento", "Concluidos"],
    valores: [contagem.pendente, contagem.andamento, contagem.concluido]
  };
}

function montarDatasetPrioridade(dados) {
  const contagem = {
    baixa: 0,
    media: 0,
    alta: 0
  };

  for (let i = 0; i < dados.length; i += 1) {
    const prioridade = dados[i].prioridade;
    if (prioridade === "baixa") {
      contagem.baixa += 1;
    } else if (prioridade === "media") {
      contagem.media += 1;
    } else if (prioridade === "alta") {
      contagem.alta += 1;
    }
  }

  return {
    labels: ["Baixa", "Media", "Alta"],
    valores: [contagem.baixa, contagem.media, contagem.alta]
  };
}

function montarDatasetLinha(dados, periodo) {
  if (dados.length === 0) {
    return {
      labels: [],
      valores: []
    };
  }

  const intervalo = definirIntervaloLinha(dados, periodo);
  const contagemPorDia = {};

  for (let i = 0; i < dados.length; i += 1) {
    const chave = criarChaveDia(dados[i].data);
    if (!contagemPorDia[chave]) {
      contagemPorDia[chave] = 0;
    }
    contagemPorDia[chave] += 1;
  }

  const labels = [];
  const valores = [];
  const cursor = new Date(intervalo.inicio);

  while (cursor <= intervalo.fim) {
    const chave = criarChaveDia(cursor);
    labels.push(formatarDataCurta(cursor));
    valores.push(contagemPorDia[chave] || 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    labels: labels,
    valores: valores
  };
}

function renderizarCards(metricas) {
  document.getElementById("metrica-total").textContent = String(metricas.total);
  document.getElementById("metrica-pendentes").textContent = String(metricas.pendentes);
  document.getElementById("metrica-andamento").textContent = String(metricas.andamento);
  document.getElementById("metrica-concluidos").textContent = String(metricas.concluidos);
  document.getElementById("metrica-alta").textContent = String(metricas.altaPrioridade);
}

function renderizarTabela(dados) {
  const corpoTabela = document.getElementById("tabela-corpo");
  corpoTabela.innerHTML = "";

  if (dados.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='4'>Sem itens para o periodo selecionado.</td></tr>";
    return;
  }

  const ordenados = dados.slice();
  ordenados.sort(function (a, b) {
    return b.data.getTime() - a.data.getTime();
  });

  const limite = ordenados.length > 10 ? 10 : ordenados.length;

  for (let i = 0; i < limite; i += 1) {
    const item = ordenados[i];
    const linha = document.createElement("tr");

    linha.innerHTML =
      "<td>" + escaparHtml(item.tituloOuAssunto) + "</td>" +
      "<td>" + formatarStatus(item.status) + "</td>" +
      "<td>" + formatarPrioridade(item.prioridade) + "</td>" +
      "<td>" + formatarDataCompleta(item.data) + "</td>";

    corpoTabela.appendChild(linha);
  }
}

function renderizarGraficos(dados, periodo) {
  const datasetStatus = montarDatasetStatus(dados);
  const datasetPrioridade = montarDatasetPrioridade(dados);
  const datasetLinha = montarDatasetLinha(dados, periodo);

  if (estado.graficos.status) {
    estado.graficos.status.destroy();
  }
  if (estado.graficos.prioridade) {
    estado.graficos.prioridade.destroy();
  }
  if (estado.graficos.linha) {
    estado.graficos.linha.destroy();
  }

  estado.graficos.status = new Chart(document.getElementById("grafico-status"), {
    type: "pie",
    data: {
      labels: datasetStatus.labels,
      datasets: [{
        data: datasetStatus.valores,
        backgroundColor: ["#d26464", "#e9a83b", "#3da877"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });

  estado.graficos.prioridade = new Chart(document.getElementById("grafico-prioridade"), {
    type: "bar",
    data: {
      labels: datasetPrioridade.labels,
      datasets: [{
        label: "Quantidade",
        data: datasetPrioridade.valores,
        backgroundColor: ["#6ba4ff", "#f3c64f", "#f27c59"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  const labelsLinha = datasetLinha.labels.length ? datasetLinha.labels : ["Sem dados"];
  const valoresLinha = datasetLinha.valores.length ? datasetLinha.valores : [0];

  estado.graficos.linha = new Chart(document.getElementById("grafico-linha"), {
    type: "line",
    data: {
      labels: labelsLinha,
      datasets: [{
        label: "Itens criados",
        data: valoresLinha,
        borderColor: "#0f6cbf",
        backgroundColor: "rgba(15, 108, 191, 0.16)",
        fill: true,
        tension: 0.25,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

function atualizarMensagemEstado(totalNormalizado, totalFiltrado, periodo) {
  if (totalNormalizado === 0) {
    mostrarMensagem("Nao ha dados salvos. Use o botao para gerar dados de exemplo.", "alerta");
    return;
  }

  if (totalFiltrado === 0) {
    mostrarMensagem("Nenhum item encontrado para o periodo: " + textoPeriodo(periodo) + ".", "alerta");
    return;
  }

  mostrarMensagem("Exibindo " + totalFiltrado + " item(ns) para o periodo: " + textoPeriodo(periodo) + ".", "info");
}

function mostrarMensagem(texto, tipo) {
  const areaMensagem = document.getElementById("mensagem-estado");
  areaMensagem.textContent = texto;
  areaMensagem.className = "mensagem-estado " + (tipo || "info");
}

function extrairTituloOuAssunto(item, indice) {
  if (typeof item.titulo === "string" && item.titulo.trim().length > 0) {
    return item.titulo.trim();
  }
  if (typeof item.assunto === "string" && item.assunto.trim().length > 0) {
    return item.assunto.trim();
  }
  return "Item " + (indice + 1);
}

function formatarStatus(status) {
  if (status === "pendente") {
    return "Pendente";
  }
  if (status === "andamento") {
    return "Em andamento";
  }
  return "Concluido";
}

function formatarPrioridade(prioridade) {
  if (prioridade === "alta") {
    return "Alta";
  }
  if (prioridade === "media") {
    return "Media";
  }
  return "Baixa";
}

function formatarDataCurta(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return dia + "/" + mes;
}

function formatarDataCompleta(data) {
  return data.toLocaleDateString("pt-BR");
}

function limparTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function criarChaveDia(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return ano + "-" + mes + "-" + dia;
}

function definirIntervaloLinha(dados, periodo) {
  if (periodo === "todos") {
    let menorData = novoDia(dados[0].data);
    let maiorData = novoDia(dados[0].data);

    for (let i = 1; i < dados.length; i += 1) {
      const dataAtual = novoDia(dados[i].data);
      if (dataAtual < menorData) {
        menorData = dataAtual;
      }
      if (dataAtual > maiorData) {
        maiorData = dataAtual;
      }
    }

    return {
      inicio: menorData,
      fim: maiorData
    };
  }

  const dias = periodo === "30" ? 30 : 7;
  const fim = novoDia(new Date());
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - (dias - 1));

  return {
    inicio: inicio,
    fim: fim
  };
}

function novoDia(data) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function textoPeriodo(periodo) {
  if (periodo === "30") {
    return "30 dias";
  }
  if (periodo === "todos") {
    return "todos";
  }
  return "7 dias";
}

function numeroAleatorio(minimo, maximo) {
  return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

function escaparHtml(texto) {
  const mapa = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };

  return texto.replace(/[&<>"']/g, function (caractere) {
    return mapa[caractere];
  });
}
