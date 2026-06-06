import { useMemo, useState } from "react";

const API_BASE = "https://publica.cnpj.ws/cnpj";
const RECEITAWS_API_BASE = "https://www.receitaws.com.br/v1/cnpj";

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
  if (lowerKey.includes("cnpj") && onlyDigits(value).length === 14) return formatCNPJ(value);
  if ((lowerKey.includes("cpf") || lowerKey.includes("documento")) && onlyDigits(value).length === 11) return formatCPF(value);
  if (lowerKey.includes("cep")) return formatCEP(value);

  if (lowerKey.includes("data") || lowerKey.includes("atualizado_em") || lowerKey.includes("criado_em")) {
    return formatDate(value);
  }

  if (lowerKey.includes("capital_social")) return formatCurrencyBRL(value);
  return String(value);
}

function getSituacaoBadgeClass(situacao) {
  const text = String(situacao || "").toLowerCase();
  if (text.includes("ativa")) return "border-emerald-400/50 bg-emerald-400/15 text-emerald-100 shadow-emerald-500/20";
  if (text.includes("baixada") || text.includes("inapta") || text.includes("suspensa")) {
    return "border-red-400/50 bg-red-400/15 text-red-100 shadow-red-500/20";
  }
  return "border-amber-400/50 bg-amber-400/15 text-amber-100 shadow-amber-500/20";
}

function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function Section({ eyebrow, title, children, action }) {
  return (
    <section className="rounded-[1.7rem] border border-cyan-400/10 bg-slate-950/85 p-5 shadow-2xl shadow-black/30 ring-1 ring-white/5 backdrop-blur md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-black text-slate-50">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition ${
        highlight
          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-50 shadow-cyan-500/10"
          : "border-white/10 bg-white/[0.04] text-slate-100 shadow-black/20"
      }`}
    >
      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${highlight ? "text-cyan-200" : "text-slate-400"}`}>{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-5">{value || "-"}</p>
    </div>
  );
}

function CompactGrid({ items, columns = "lg:grid-cols-3" }) {
  const visibleItems = items.filter((item) => item && isFilled(item.value));
  if (visibleItems.length === 0) {
    return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-medium text-slate-300">Nenhum dado retornado para esta seção.</p>;
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
    return <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-400/10 bg-slate-950/70">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-cyan-400/10 bg-cyan-400/10 text-xs uppercase tracking-wide text-cyan-100">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-black">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top text-slate-200 transition hover:bg-cyan-400/5">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 font-semibold">
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

function getDynamicGridClass(level) {
  if (level === 0) return "grid gap-3 md:grid-cols-2 xl:grid-cols-3";
  if (level === 1) return "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";
  return "grid gap-2 sm:grid-cols-2";
}

function getDynamicCardClass({ complex, level, entryCount }) {
  const shouldExpand = complex && (level <= 1 || entryCount > 6);
  const span = shouldExpand ? "md:col-span-2 xl:col-span-3" : "";
  const padding = complex ? "p-4" : "p-3";
  const background = complex ? "bg-slate-900/70" : "bg-white/[0.04]";
  return `rounded-xl border border-white/10 ${background} ${padding} ${span}`;
}

function DataRenderer({ data, name = "dados", level = 0 }) {
  if (data === null || data === undefined || data === "") return <span className="text-slate-500">-</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-500">Lista vazia</span>;
    const itemGrid = data.length === 1 ? "grid gap-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3";

    return (
      <div className={itemGrid}>
        {data.map((item, index) => (
          <div key={`${name}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-cyan-300/75">Item {index + 1}</div>
            <DataRenderer data={item} name={`${name}-${index}`} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-slate-500">Objeto vazio</span>;

    return (
      <div className={getDynamicGridClass(level)}>
        {entries.map(([key, value]) => {
          const complex = value && typeof value === "object";
          const childCount = complex && !Array.isArray(value) ? Object.keys(value).length : Array.isArray(value) ? value.length : 0;

          return (
            <div key={`${name}-${key}`} className={getDynamicCardClass({ complex, level, entryCount: childCount })}>
              <div className="mb-2 text-xs font-black uppercase tracking-wide text-cyan-300/75">{humanizeKey(key)}</div>
              {complex ? (
                <DataRenderer data={value} name={key} level={level + 1} />
              ) : (
                <div className="break-words text-sm font-semibold leading-5 text-slate-200">{smartFormatValue(key, value)}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="break-words text-sm font-semibold text-slate-200">{smartFormatValue(name, data)}</span>;
}

function normalizeSocioDocument(socio) {
  const value = socio?.cpf_cnpj_socio || socio?.cnpj_cpf_socio || socio?.documento || "";
  const digits = onlyDigits(value);
  if (digits.length === 14) return formatCNPJ(digits);
  if (digits.length === 11) return formatCPF(digits);
  return value || "-";
}

function normalizeReceitaWsSocio(socio) {
  if (!socio || typeof socio !== "object") return null;

  return {
    nome: socio.nome || socio.nome_socio || "",
    cpf_cnpj_socio: socio.cpf_cnpj_socio || socio.cnpj_cpf_socio || socio.cpf || socio.cnpj || "",
    tipo: socio.tipo || "",
    data_entrada: socio.data_entrada || "",
    cpf_representante_legal: socio.cpf_representante_legal || socio.cpf_rep_legal || "",
    nome_representante: socio.nome_representante || socio.nome_rep_legal || "",
    faixa_etaria: socio.faixa_etaria || "",
    qualificacao_socio: {
      descricao: socio.qual || socio.qualificacao_socio?.descricao || socio.qualificacao || "",
    },
    qualificacao_representante: socio.qual_rep_legal || socio.qualificacao_representante || "",
    origem_dado: "ReceitaWS",
  };
}

function mergeSocios(cnpjWsSocios = [], receitaWsQsa = []) {
  const merged = [];
  const seen = new Set();

  function addSocio(socio, fallbackSource) {
    if (!socio || typeof socio !== "object") return;
    const normalized = { ...socio, origem_dado: socio.origem_dado || fallbackSource };
    const key = `${String(normalized.nome || "").trim().toUpperCase()}|${String(normalized.qualificacao_socio?.descricao || normalized.qual || "").trim().toUpperCase()}`;
    if (!String(normalized.nome || "").trim()) return;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalized);
  }

  (Array.isArray(cnpjWsSocios) ? cnpjWsSocios : []).forEach((socio) => addSocio(socio, "CNPJ.ws"));
  (Array.isArray(receitaWsQsa) ? receitaWsQsa : []).forEach((socio) => addSocio(socio, "ReceitaWS"));

  return merged;
}

async function consultarReceitaWs(cleanCnpj) {
  try {
    const response = await fetch(`${RECEITAWS_API_BASE}/${cleanCnpj}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok || responseData?.status === "ERROR") {
      return {
        data: null,
        error: responseData?.message || responseData?.mensagem || `ReceitaWS retornou HTTP ${response.status}.`,
      };
    }

    return { data: responseData, error: null };
  } catch (err) {
    return {
      data: null,
      error: err?.message || "Não foi possível consultar a ReceitaWS.",
    };
  }
}

function buildInvestigativeFlags(data) {
  if (!data) return [];
  const estabelecimento = data.estabelecimento || {};
  const socios = data.socios_consolidados || data.socios || [];
  const inscricoes = estabelecimento.inscricoes_estaduais || [];
  const flags = [];

  if (estabelecimento.situacao_cadastral && !String(estabelecimento.situacao_cadastral).toLowerCase().includes("ativa")) {
    flags.push(`Situação cadastral: ${estabelecimento.situacao_cadastral}`);
  }
  if (!estabelecimento.email) flags.push("E-mail não retornado pela base pública.");
  if (!estabelecimento.telefone1 && !estabelecimento.telefone2) flags.push("Telefone não retornado pela base pública.");
  if (socios.length === 0) flags.push("QSA/sócios não retornados pelas fontes públicas consultadas.");
  if (socios.some((socio) => String(socio.tipo || "").toLowerCase().includes("jur"))) {
    flags.push("Há pessoa jurídica no quadro societário, recomendando análise de cadeia societária.");
  }
  if (inscricoes.some((ie) => ie.ativo === false)) flags.push("Há inscrição estadual inativa ou baixada.");

  return flags;
}

function FingerprintArt() {
  return (
    <svg className="absolute right-4 top-4 hidden h-72 w-72 opacity-20 md:block" viewBox="0 0 300 300" fill="none" aria-hidden="true">
      <path d="M84 162c0-56 38-94 89-94 48 0 84 33 84 78" stroke="currentColor" strokeWidth="4" className="text-cyan-300" />
      <path d="M62 146c6-66 52-110 113-110 62 0 108 43 115 103" stroke="currentColor" strokeWidth="3" className="text-cyan-400" />
      <path d="M99 187c-2-15-4-28-4-40 0-45 31-75 76-75 42 0 72 29 72 70 0 34-8 59-20 89" stroke="currentColor" strokeWidth="4" className="text-cyan-200" />
      <path d="M117 239c-10-31-16-61-16-92 0-41 28-68 70-68 39 0 65 27 65 65 0 46-13 79-30 112" stroke="currentColor" strokeWidth="3" className="text-cyan-400" />
      <path d="M137 263c-16-46-25-80-25-118 0-34 24-56 58-56 34 0 57 23 57 56 0 50-18 89-39 122" stroke="currentColor" strokeWidth="3" className="text-cyan-200" />
      <path d="M157 268c-18-43-31-81-31-123 0-26 18-43 44-43 26 0 43 17 43 43 0 48-21 91-42 122" stroke="currentColor" strokeWidth="4" className="text-cyan-300" />
      <path d="M176 267c22-35 31-73 31-120 0-22-14-36-36-36-21 0-35 14-35 36 0 37 10 73 28 119" stroke="currentColor" strokeWidth="3" className="text-cyan-100" />
    </svg>
  );
}

function TacticalHero({ filledFields, socios }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#03140e] px-6 py-8 text-white shadow-2xl shadow-black/50 md:px-10 md:py-10">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(34,211,238,.08) 1px, transparent 1px), linear-gradient(0deg, rgba(34,211,238,.06) 1px, transparent 1px), radial-gradient(circle at 68% 48%, rgba(34,211,238,.22), transparent 23%), radial-gradient(circle at 15% 30%, rgba(16,185,129,.18), transparent 24%)",
          backgroundSize: "70px 70px, 70px 70px, auto, auto",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-emerald-950/55 to-black/30" />
      <div className="absolute -left-16 bottom-0 hidden h-80 w-80 rounded-full border border-cyan-300/10 bg-cyan-300/5 blur-sm md:block" />
      <FingerprintArt />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-sm font-bold text-cyan-200">• by Delta_Victor_DPRC</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-violet-300 drop-shadow md:text-7xl lg:text-8xl">OSINT – CNPJ</h1>
          <div className="mt-5 h-1 w-full max-w-xl bg-cyan-300 shadow-lg shadow-cyan-400/40" />
          <div className="mt-4 h-1 w-full max-w-xl bg-cyan-300 shadow-lg shadow-cyan-400/40" />
          <p className="mt-7 text-3xl font-black leading-tight text-cyan-100 md:text-4xl">Não seja um investigador que não investiga.</p>
          <p className="mt-3 max-w-3xl text-lg font-bold leading-7 text-cyan-50/90 md:text-2xl">Ferramenta para auxiliar profissionais da Lei desamparados.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px] lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-black/30 p-4 shadow-lg shadow-cyan-950/40 backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Status</p>
            <p className="mt-2 text-sm font-black text-emerald-200">Operacional</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-black/30 p-4 shadow-lg shadow-cyan-950/40 backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Campos</p>
            <p className="mt-1 text-3xl font-black text-white">{filledFields}</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-black/30 p-4 shadow-lg shadow-cyan-950/40 backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">QSA</p>
            <p className="mt-1 text-3xl font-black text-white">{socios.length}</p>
          </div>
        </div>
      </div>
    </header>
  );
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
  const socios = data?.socios_consolidados || data?.socios || [];
  const receitaWsInfo = data?.fontes_adicionais?.receitaws || null;
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

      const sociosCnpjWs = Array.isArray(responseData?.socios) ? responseData.socios : [];
      const receitaWsResult = await consultarReceitaWs(cleanCnpj);
      const qsaReceitaWs = Array.isArray(receitaWsResult.data?.qsa)
        ? receitaWsResult.data.qsa.map(normalizeReceitaWsSocio).filter(Boolean)
        : [];
      const sociosConsolidados = mergeSocios(sociosCnpjWs, qsaReceitaWs);

      setData({
        ...responseData,
        socios_consolidados: sociosConsolidados,
        qsa_receitaws: qsaReceitaWs,
        fontes_adicionais: {
          cnpjws: {
            consultado: true,
            sucesso: true,
            total_qsa: sociosCnpjWs.length,
          },
          receitaws: {
            consultado: true,
            sucesso: Boolean(receitaWsResult.data),
            erro: receitaWsResult.error,
            total_qsa: qsaReceitaWs.length,
            dados: receitaWsResult.data,
          },
        },
      });
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
    <main className="min-h-screen bg-[#020807] px-4 py-6 text-slate-100 md:py-8">
      <div
        className="fixed inset-0 -z-10 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,.12), transparent 26%), radial-gradient(circle at 85% 0%, rgba(124,58,237,.14), transparent 28%), linear-gradient(135deg, rgba(8,47,73,.45), transparent 45%), linear-gradient(90deg, rgba(34,211,238,.04) 1px, transparent 1px), linear-gradient(0deg, rgba(34,211,238,.035) 1px, transparent 1px)",
          backgroundSize: "auto, auto, auto, 58px 58px, 58px 58px",
        }}
      />

      <section className="mx-auto max-w-7xl space-y-6">
        <TacticalHero filledFields={filledFields} socios={socios} />

        <form onSubmit={handleSubmit} className="rounded-[1.7rem] border border-cyan-400/15 bg-slate-950/90 p-4 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur md:p-5">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Módulo de consulta</p>
              <label className="mt-1 block text-lg font-black text-white">CNPJ</label>
            </div>
            <p className="text-xs font-medium text-slate-400">Consulta via fontes públicas. Use apenas para finalidade legítima.</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={cnpj}
              onChange={(event) => setCnpj(maskCNPJInput(event.target.value))}
              placeholder="00.000.000/0000-00"
              className="h-13 flex-1 rounded-2xl border border-cyan-300/20 bg-black/40 px-4 py-3 text-lg font-black tracking-wide text-cyan-50 outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/10"
              inputMode="numeric"
              maxLength={18}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-400 px-7 py-3 font-black uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div>}
        </form>

        {loading && (
          <div className="rounded-[1.7rem] border border-cyan-400/10 bg-slate-950/85 p-6 shadow-2xl shadow-black/30">
            <div className="h-4 w-48 animate-pulse rounded bg-cyan-300/20" />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="h-24 animate-pulse rounded-2xl bg-cyan-300/10" />
              <div className="h-24 animate-pulse rounded-2xl bg-cyan-300/10" />
              <div className="h-24 animate-pulse rounded-2xl bg-cyan-300/10" />
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            <Section eyebrow="Resumo principal" title="Resumo da empresa">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">{data.razao_social || "-"}</h2>
                  <p className="mt-1 text-sm font-semibold text-cyan-200/80">{formatCNPJ(fullCnpj || cnpj)}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-black shadow-lg ${getSituacaoBadgeClass(estabelecimento.situacao_cadastral)}`}>
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
                  { label: "QSA via CNPJ.ws", value: String(data?.fontes_adicionais?.cnpjws?.total_qsa ?? 0) },
                  { label: "QSA via ReceitaWS", value: String(receitaWsInfo?.total_qsa ?? 0) },
                  { label: "Status ReceitaWS", value: receitaWsInfo?.sucesso ? "Consultada com sucesso" : receitaWsInfo?.erro || "Não consultada" },
                  { label: "CNPJ raiz", value: data.cnpj_raiz },
                ]}
              />

              <div className="mt-4">
                <Table
                  emptyMessage="Nenhum sócio/QSA retornado pelas fontes públicas consultadas para este CNPJ."
                  rows={socios}
                  columns={[
                    { key: "nome", label: "Nome / Razão social", render: (row) => row.nome || "-" },
                    { key: "documento", label: "CPF/CNPJ", render: (row) => normalizeSocioDocument(row) },
                    { key: "tipo", label: "Tipo", render: (row) => row.tipo || "-" },
                    { key: "qualificacao_socio.descricao", label: "Qualificação", render: (row) => row.qualificacao_socio?.descricao || "-" },
                    { key: "data_entrada", label: "Entrada", render: (row) => formatDate(row.data_entrada) },
                    { key: "representante", label: "Representante legal", render: (row) => [row.nome_representante, smartFormatValue("cpf_representante_legal", row.cpf_representante_legal)].filter((v) => v && v !== "-").join(" - ") || "-" },
                    { key: "pais.nome", label: "País", render: (row) => row.pais?.nome || "-" },
                    { key: "origem_dado", label: "Fonte", render: (row) => row.origem_dado || "CNPJ.ws" },
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
                    <div key={flag} className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">{flag}</div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">Nenhum indicador automático relevante foi identificado nos campos retornados.</p>
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
                    className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
                  >
                    {rawVisible ? "Ocultar JSON bruto" : "Ver JSON bruto"}
                  </button>
                  <button
                    type="button"
                    onClick={copyJson}
                    className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    {copied ? "JSON copiado" : "Copiar JSON"}
                  </button>
                </div>
              }
            >
              {rawVisible ? (
                <pre className="max-h-[620px] overflow-auto rounded-2xl border border-cyan-300/10 bg-black/70 p-4 text-xs leading-6 text-cyan-100">{JSON.stringify(data, null, 2)}</pre>
              ) : (
                <DataRenderer data={data} />
              )}
            </Section>
          </div>
        )}
      </section>
    </main>
  );
}
