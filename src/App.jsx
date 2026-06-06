import { useMemo, useState } from "react";

const API_BASE = "https://publica.cnpj.ws/cnpj";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCNPJ(value) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length !== 14) return digits || "-";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatCPF(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length !== 11) return value || "-";
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function maskCNPJInput(value) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCEP(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 8) return value || "-";
  return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function formatCurrencyBRL(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(String(value).replace(",", "."));
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function formatDate(value) {
  if (!value || typeof value !== "string") return value || "-";
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T/;
  if (!isoDate.test(value) && !isoDateTime.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: isoDateTime.test(value) ? "short" : undefined,
  }).format(date);
}

function formatBoolean(value) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return value ?? "-";
}

function humanizeKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function countFilledFields(data) {
  let count = 0;

  function walk(value) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
      return;
    }
    if (isFilled(value)) count += 1;
  }

  walk(data);
  return count;
}

function smartFormatValue(key, value) {
  if (value === null || value === undefined || value === "") return "-";
  const lowerKey = String(key).toLowerCase();

  if (typeof value === "boolean") return formatBoolean(value);

  if (lowerKey.includes("cnpj") && onlyDigits(value).length === 14) {
    return formatCNPJ(value);
  }

  if ((lowerKey.includes("cpf") || lowerKey.includes("documento")) && onlyDigits(value).length === 11) {
    return formatCPF(value);
  }

  if (lowerKey.includes("cep")) return formatCEP(value);

  if (
    lowerKey.includes("data") ||
    lowerKey.includes("atualizado_em") ||
    lowerKey.includes("criado_em")
  ) {
    return formatDate(value);
  }

  if (lowerKey.includes("capital_social")) return formatCurrencyBRL(value);

  return String(value);
}

function getSituacaoBadgeClass(situacao) {
  const text = String(situacao || "").toLowerCase();
  if (text.includes("ativa")) return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (text.includes("baixada") || text.includes("inapta") || text.includes("suspensa")) {
    return "bg-red-100 text-red-800 ring-red-200";
  }
  return "bg-amber-100 text-amber-800 ring-amber-200";
}

function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function SummaryCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${highlight ? "border-slate-300 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"}`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${highlight ? "text-cyan-200" : "text-slate-500"}`}>{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-5">{value || "-"}</p>
    </div>
  );
}

function Section({ eyebrow, title, children, action }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CompactGrid({ items, columns = "lg:grid-cols-3" }) {
  const visibleItems = items.filter((item) => item && isFilled(item.value));
  if (visibleItems.length === 0) {
    return <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">Nenhum dado retornado para esta seção.</p>;
  }
  return (
    <div className={`grid gap-3 md:grid-cols-2 ${columns}`}>
      {visibleItems.map((item) => (
        <SummaryCard key={item.label} label={item.label} value={item.value} highlight={item.highlight} />
      ))}
    </div>
  );
}

function Table({ columns, rows, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-black">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 font-semibold text-slate-800">
                    {column.render ? column.render(row) : smartFormatValue(column.key, getValueByPath(row, column.key))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataRenderer({ data, name = "dados", level = 0 }) {
  if (data === null || data === undefined || data === "") return <span className="text-slate-400">-</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400">Lista vazia</span>;
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((item, index) => (
          <div key={`${name}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Item {index + 1}</div>
            <DataRenderer data={item} name={`${name}-${index}`} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-slate-400">Objeto vazio</span>;

    return (
      <div className={`grid gap-3 ${level === 0 ? "md:grid-cols-2 xl:grid-cols-3" : ""}`}>
        {entries.map(([key, value]) => {
          const complex = value && typeof value === "object";
          return (
            <div key={`${name}-${key}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">{humanizeKey(key)}</div>
              {complex ? (
                <DataRenderer data={value} name={key} level={level + 1} />
              ) : (
                <div className="break-words text-sm font-semibold text-slate-800">{smartFormatValue(key, value)}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="break-words text-sm font-semibold text-slate-800">{smartFormatValue(name, data)}</span>;
}

function normalizeSocioDocument(socio) {
  const value = socio?.cpf_cnpj_socio || socio?.cnpj_cpf_socio || socio?.documento || "";
  const digits = onlyDigits(value);
  if (digits.length === 14) return formatCNPJ(digits);
  if (digits.length === 11) return formatCPF(digits);
  return value || "-";
}

function buildInvestigativeFlags(data) {
  if (!data) return [];
  const estabelecimento = data.estabelecimento || {};
  const socios = data.socios || [];
  const inscricoes = estabelecimento.inscricoes_estaduais || [];
  const flags = [];

  if (estabelecimento.situacao_cadastral && !String(estabelecimento.situacao_cadastral).toLowerCase().includes("ativa")) {
    flags.push(`Situação cadastral: ${estabelecimento.situacao_cadastral}`);
  }
  if (!estabelecimento.email) flags.push("E-mail não retornado pela base pública.");
  if (!estabelecimento.telefone1 && !estabelecimento.telefone2) flags.push("Telefone não retornado pela base pública.");
  if (socios.length === 0) flags.push("QSA/sócios não retornados pela base pública.");
  if (socios.some((socio) => String(socio.tipo || "").toLowerCase().includes("jur"))) {
    flags.push("Há pessoa jurídica no quadro societário, recomendando análise de cadeia societária.");
  }
  if (inscricoes.some((ie) => ie.ativo === false)) flags.push("Há inscrição estadual inativa ou baixada.");

  return flags;
}

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [data, setData] = useState(null);
  const [rawVisible, setRawVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const estabelecimento = data?.estabelecimento || {};
  const cidade = estabelecimento?.cidade?.nome || "";
  const uf = estabelecimento?.estado?.sigla || "";
  const atividadePrincipal = estabelecimento?.atividade_principal || {};
  const atividadesSecundarias = estabelecimento?.atividades_secundarias || [];
  const inscricoes = estabelecimento?.inscricoes_estaduais || [];
  const suframa = estabelecimento?.suframa || data?.suframa || [];
  const socios = data?.socios || [];
  const simples = data?.simples || {};
  const fullCnpj = estabelecimento?.cnpj || (data?.cnpj_raiz ? `${data.cnpj_raiz}${estabelecimento?.ordem || ""}${estabelecimento?.digito_verificador || ""}` : "");

  const endereco = [
    estabelecimento.tipo_logradouro,
    estabelecimento.logradouro,
    estabelecimento.numero,
    estabelecimento.complemento,
    estabelecimento.bairro,
    estabelecimento.cep ? `CEP ${formatCEP(estabelecimento.cep)}` : "",
  ].filter(Boolean).join(", ");

  const telefones = [
    estabelecimento.ddd1 && estabelecimento.telefone1 ? `(${estabelecimento.ddd1}) ${estabelecimento.telefone1}` : "",
    estabelecimento.ddd2 && estabelecimento.telefone2 ? `(${estabelecimento.ddd2}) ${estabelecimento.telefone2}` : "",
    estabelecimento.ddd_fax && estabelecimento.fax ? `Fax: (${estabelecimento.ddd_fax}) ${estabelecimento.fax}` : "",
  ].filter(Boolean).join(" / ");

  const filledFields = useMemo(() => (data ? countFilledFields(data) : 0), [data]);
  const flags = useMemo(() => buildInvestigativeFlags(data), [data]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanCnpj = onlyDigits(cnpj);

    setError("");
    setData(null);
    setRawVisible(false);
    setCopied(false);

    if (cleanCnpj.length !== 14) {
      setError("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/${cleanCnpj}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 404) throw new Error("CNPJ não encontrado na base pública.");
        if (response.status === 429) throw new Error("Limite de consultas atingido. Aguarde alguns instantes e tente novamente.");
        throw new Error(responseData?.detalhes || responseData?.message || "Erro ao consultar o CNPJ.");
      }

      setData(responseData);
    } catch (err) {
      setError(err.message || "Falha inesperada na consulta.");
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    if (!data) return;
    const json = JSON.stringify(data, null, 2);

    try {
      await navigator.clipboard.writeText(json);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = json;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] bg-slate-100 shadow-2xl ring-1 ring-white/10">
          <header className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Consulta pública CNPJ.ws</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Consulta CNPJ Investigativa</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Consulta cadastral com resumo compacto, QSA, responsáveis, atividades, inscrições, indicadores e renderização integral do JSON retornado pela API.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center md:min-w-[300px]">
                <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Campos</p>
                  <p className="mt-1 text-3xl font-black">{filledFields}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-xs uppercase tracking-wide text-slate-300">QSA</p>
                  <p className="mt-1 text-3xl font-black">{socios.length}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="px-6 py-6 md:px-10">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <label className="mb-2 block text-sm font-bold text-slate-700">CNPJ</label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={cnpj}
                  onChange={(event) => setCnpj(maskCNPJInput(event.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="h-12 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-lg font-semibold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  inputMode="numeric"
                  maxLength={18}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 rounded-2xl bg-cyan-600 px-6 font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Consultando..." : "Consultar"}
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">A consulta usa apenas os 14 números do CNPJ. Não insira dados de investigação no GitHub.</p>
              {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            </form>

            {loading && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              </div>
            )}

            {data && !loading && (
              <div className="mt-6 space-y-6">
                <Section eyebrow="Resumo principal" title="Resumo da empresa">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">{data.razao_social || "-"}</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{formatCNPJ(fullCnpj || cnpj)}</p>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-black ring-1 ${getSituacaoBadgeClass(estabelecimento.situacao_cadastral)}`}>
                      {estabelecimento.situacao_cadastral || "Situação não informada"}
                    </span>
                  </div>

                  <CompactGrid
                    items={[
                      { label: "Razão social", value: data.razao_social, highlight: true },
                      { label: "Nome fantasia", value: estabelecimento.nome_fantasia },
                      { label: "CNPJ", value: formatCNPJ(fullCnpj || cnpj) },
                      { label: "Capital social", value: formatCurrencyBRL(data.capital_social) },
                      { label: "Porte", value: data.porte?.descricao },
                      { label: "Natureza jurídica", value: data.natureza_juridica?.descricao },
                      { label: "Situação cadastral", value: estabelecimento.situacao_cadastral },
                      { label: "Data situação", value: formatDate(estabelecimento.data_situacao_cadastral) },
                      { label: "Motivo situação", value: estabelecimento.motivo_situacao_cadastral },
                      { label: "Cidade/UF", value: [cidade, uf].filter(Boolean).join(" / ") },
                      { label: "Endereço", value: endereco },
                      { label: "Telefone", value: telefones },
                      { label: "E-mail", value: estabelecimento.email },
                      { label: "Atualizado em", value: formatDate(data.atualizado_em || estabelecimento.atualizado_em) },
                    ]}
                  />
                </Section>

                <Section eyebrow="Responsáveis e vínculos" title="Responsável, qualificação e QSA">
                  <CompactGrid
                    columns="lg:grid-cols-2"
                    items={[
                      { label: "Responsável federativo", value: data.responsavel_federativo || "Não informado" },
                      { label: "Qualificação do responsável", value: data.qualificacao_do_responsavel?.descricao || data.qualificacao_do_responsavel },
                      { label: "Total de sócios/QSA", value: socios.length ? String(socios.length) : "0" },
                      { label: "CNPJ raiz", value: data.cnpj_raiz },
                    ]}
                  />

                  <div className="mt-4">
                    <Table
                      emptyMessage="Nenhum sócio/QSA retornado pela API pública para este CNPJ."
                      rows={socios}
                      columns={[
                        { key: "nome", label: "Nome / Razão social", render: (row) => row.nome || "-" },
                        { key: "documento", label: "CPF/CNPJ", render: (row) => normalizeSocioDocument(row) },
                        { key: "tipo", label: "Tipo", render: (row) => row.tipo || "-" },
                        { key: "qualificacao_socio.descricao", label: "Qualificação", render: (row) => row.qualificacao_socio?.descricao || "-" },
                        { key: "data_entrada", label: "Entrada", render: (row) => formatDate(row.data_entrada) },
                        { key: "representante", label: "Representante legal", render: (row) => [row.nome_representante, smartFormatValue("cpf_representante_legal", row.cpf_representante_legal)].filter((v) => v && v !== "-").join(" - ") || "-" },
                        { key: "pais.nome", label: "País", render: (row) => row.pais?.nome || "-" },
                      ]}
                    />
                  </div>
                </Section>

                <Section eyebrow="Atividades econômicas" title="CNAE principal e atividades secundárias">
                  <CompactGrid
                    columns="lg:grid-cols-2"
                    items={[
                      { label: "CNAE principal", value: [atividadePrincipal.id, atividadePrincipal.descricao].filter(Boolean).join(" - "), highlight: true },
                      { label: "Quantidade de secundárias", value: atividadesSecundarias.length ? String(atividadesSecundarias.length) : "0" },
                    ]}
                  />

                  <div className="mt-4">
                    <Table
                      emptyMessage="Nenhuma atividade secundária retornada."
                      rows={atividadesSecundarias}
                      columns={[
                        { key: "id", label: "Código" },
                        { key: "descricao", label: "Descrição" },
                      ]}
                    />
                  </div>
                </Section>

                <Section eyebrow="Regimes e cadastros" title="Simples, MEI, inscrições estaduais e Suframa">
                  <CompactGrid
                    items={[
                      { label: "Optante Simples", value: formatBoolean(simples.simples) },
                      { label: "Data opção Simples", value: formatDate(simples.data_opcao_simples) },
                      { label: "Data exclusão Simples", value: formatDate(simples.data_exclusao_simples) },
                      { label: "MEI", value: formatBoolean(simples.mei) },
                      { label: "Data opção MEI", value: formatDate(simples.data_opcao_mei) },
                      { label: "Data exclusão MEI", value: formatDate(simples.data_exclusao_mei) },
                    ]}
                  />

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <Table
                      emptyMessage="Nenhuma inscrição estadual retornada."
                      rows={inscricoes}
                      columns={[
                        { key: "inscricao_estadual", label: "Inscrição" },
                        { key: "ativo", label: "Ativo", render: (row) => formatBoolean(row.ativo) },
                        { key: "estado.sigla", label: "UF", render: (row) => row.estado?.sigla || "-" },
                        { key: "atualizado_em", label: "Atualizado", render: (row) => formatDate(row.atualizado_em) },
                      ]}
                    />

                    <Table
                      emptyMessage="Nenhum registro Suframa retornado."
                      rows={Array.isArray(suframa) ? suframa : []}
                      columns={[
                        { key: "numero", label: "Número" },
                        { key: "inscricao", label: "Inscrição" },
                        { key: "ativo", label: "Ativo", render: (row) => formatBoolean(row.ativo) },
                        { key: "atualizado_em", label: "Atualizado", render: (row) => formatDate(row.atualizado_em) },
                      ]}
                    />
                  </div>
                </Section>

                <Section eyebrow="Apoio à análise" title="Indicadores rápidos">
                  {flags.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {flags.map((flag) => (
                        <div key={flag} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">{flag}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Nenhum indicador automático relevante foi identificado nos campos retornados.</p>
                  )}
                </Section>

                <Section
                  eyebrow="Conferência integral"
                  title="Todos os dados retornados pela API"
                  action={
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setRawVisible((current) => !current)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        {rawVisible ? "Ocultar JSON bruto" : "Ver JSON bruto"}
                      </button>
                      <button
                        type="button"
                        onClick={copyJson}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                      >
                        {copied ? "JSON copiado" : "Copiar JSON"}
                      </button>
                    </div>
                  }
                >
                  {rawVisible ? (
                    <pre className="max-h-[620px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-cyan-100">{JSON.stringify(data, null, 2)}</pre>
                  ) : (
                    <DataRenderer data={data} />
                  )}
                </Section>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
