"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, Check, LoaderCircle, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import type {
  BoltAIResponse,
  BoltContextType,
  BoltConversation,
  BoltMessage,
  BoltPlanChangePreview,
  BoltPlanSession,
} from "@/lib/ai/types";

const starters = [
  "¿Qué hago hoy?",
  "¿Cómo voy?",
  "Analiza mi última carrera",
  "¿Estoy recuperado?",
  "Explícame mi plan",
  "Analiza mi semana",
  "¿Cómo uso Marathon?",
  "¿Qué puedes hacer?",
];

interface WidgetContext {
  type: BoltContextType;
  refId: string | null;
}

export function BoltWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const defaultContext = useMemo(() => contextFromPath(pathname), [pathname]);
  const [contextOverride, setContextOverride] = useState<WidgetContext | null>(null);
  const context = contextOverride ?? defaultContext;
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<BoltConversation | null>(null);
  const [messages, setMessages] = useState<BoltMessage[]>([]);
  const [proposal, setProposal] = useState<BoltPlanChangePreview | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [startFresh, setStartFresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const suggestedPrompts = getLastSuggestedPrompts(messages);

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<{ prompt?: string; contextType?: BoltContextType; contextRefId?: string | null }>).detail;
      setContextOverride({ type: detail?.contextType ?? defaultContext.type, refId: detail?.contextRefId ?? defaultContext.refId });
      setConversation(null);
      setMessages([]);
      setProposal(null);
      setStartFresh(false);
      setLoadingHistory(true);
      setError(null);
      setInput(detail?.prompt ?? "");
      setOpen(true);
    }
    window.addEventListener("open-bolt-ai", handleOpen);
    return () => window.removeEventListener("open-bolt-ai", handleOpen);
  }, [defaultContext]);

  useEffect(() => {
    if (!open) return;
    if (startFresh) return;
    let active = true;
    const params = new URLSearchParams({ contextType: context.type });
    if (context.refId) params.set("contextRefId", context.refId);
    void fetch(`/api/bolt/chat?${params}`, { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(async ({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.error ?? "Bolt AI no está disponible en este momento.");
        setConversation(payload.conversation ?? null);
        setMessages(payload.messages ?? []);
        const changeId = findLastPlanChangeId(payload.messages ?? []);
        if (changeId) {
          const previewResponse = await fetch(`/api/bolt/plan-changes/${changeId}`, { cache: "no-store" });
          const previewPayload = await previewResponse.json();
          if (active && previewResponse.ok && previewPayload.proposal?.status === "proposed") setProposal(previewPayload.proposal);
        } else setProposal(null);
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Bolt AI no está disponible en este momento."); })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, [context, open, startFresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, proposal]);

  async function submitMessage(message: string) {
    const clean = message.trim();
    if (!clean || loading) return;
    setLoading(true);
    setError(null);
    setInput("");
    try {
      const response = await fetch("/api/bolt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation?.id ?? null,
          message: clean,
          contextType: context.type,
          contextRefId: context.refId,
        }),
      });
      const payload: {
        error?: string;
        conversationId?: string;
        userMessage?: BoltMessage;
        assistantMessage?: BoltMessage;
        response?: BoltAIResponse;
        proposal?: BoltPlanChangePreview | null;
      } = await response.json();
      if (!response.ok || !payload.userMessage || !payload.assistantMessage) {
        throw new Error(payload.error ?? "Bolt AI no está disponible en este momento.");
      }
      setConversation((current) => current ?? {
        id: payload.conversationId ?? "",
        title: clean,
        contextType: context.type,
        contextRefId: context.refId,
        summary: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setMessages((current) => [...current, payload.userMessage!, payload.assistantMessage!]);
      setProposal(payload.proposal ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bolt AI no está disponible en este momento.");
    } finally {
      setLoading(false);
    }
  }

  async function applyProposal() {
    if (!proposal || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bolt/plan-changes/${proposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No pudimos aplicar el cambio.");
      setProposal((current) => current ? { ...current, status: "applied", userConfirmed: true } : null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos aplicar el cambio.");
    } finally {
      setLoading(false);
    }
  }

  async function rejectProposal() {
    if (!proposal || loading) return;
    setLoading(true);
    try {
      await fetch(`/api/bolt/plan-changes/${proposal.id}`, { method: "DELETE" });
      setProposal(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitMessage(input);
  }

  function openDefault() {
    setContextOverride(null);
    setConversation(null);
    setMessages([]);
    setProposal(null);
    setStartFresh(false);
    setLoadingHistory(true);
    setError(null);
    setOpen(true);
  }

  function toggleWidget() {
    if (open) {
      closeWidget();
      return;
    }
    openDefault();
  }

  function restartChat() {
    if (loading || loadingHistory) return;
    setConversation(null);
    setMessages([]);
    setProposal(null);
    setInput("");
    setError(null);
    setStartFresh(true);
    setLoadingHistory(false);
  }

  function closeWidget() {
    setOpen(false);
    setContextOverride(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleWidget}
        className={`group fixed right-4 flex items-center gap-2 text-left lg:right-6 lg:bottom-6 ${open ? "bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[90]" : "bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[60]"}`}
        aria-label={open ? "Cerrar Bolt AI" : "Abrir Bolt AI"}
        aria-expanded={open}
        title={open ? "Cerrar Bolt AI" : "Bolt AI · Tu entrenador inteligente"}
      >
        {!open && <span className="max-w-48 rounded-[18px] border border-line bg-white px-3.5 py-2.5 text-ink shadow-[0_10px_30px_rgba(17,17,20,.12)] transition-transform group-hover:-translate-y-0.5 sm:max-w-56">
          <span className="block text-[11px] font-bold">Hola, soy Bolt AI</span>
          <span className="mt-0.5 block text-[10px] leading-4 font-medium text-muted">¿En qué puedo ayudarte?</span>
        </span>}
        <span className="grid size-13 shrink-0 place-items-center rounded-full bg-ink text-white shadow-[0_14px_38px_rgba(17,17,20,.28)] transition-transform group-hover:-translate-y-0.5 group-active:scale-[.985]">
          <Zap size={21} fill="currentColor" />
        </span>
      </button>

      {open && <div className="fixed inset-0 z-[80] bg-ink/20 backdrop-blur-[2px] lg:pointer-events-none lg:bg-transparent lg:backdrop-blur-none" onMouseDown={(event) => { if (event.target === event.currentTarget) closeWidget(); }}>
        <section role="dialog" aria-modal="true" aria-label="Bolt AI" className="pointer-events-auto fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_80px_rgba(17,17,20,.22)] lg:inset-auto lg:right-6 lg:bottom-20 lg:h-[min(680px,calc(100vh-7rem))] lg:w-[420px]">
          <header className="flex items-center gap-3 border-b border-line/80 px-4 py-3.5 sm:px-5">
            <span className="grid size-10 place-items-center rounded-2xl bg-ink text-white"><Zap size={18} fill="currentColor" /></span>
            <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Bolt AI</h2><p className="mt-0.5 text-[11px] text-muted">Tu entrenador inteligente</p></div>
            <button type="button" onClick={restartChat} disabled={loading || loadingHistory} className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line px-2.5 text-[10px] font-bold text-muted transition hover:border-accent/25 hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-40" aria-label="Reiniciar chat de Bolt AI" title="Empezar una conversación nueva"><RotateCcw size={13} /><span>Reiniciar chat</span></button>
            <button type="button" onClick={closeWidget} aria-label="Cerrar Bolt AI" className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-subtle"><X size={19} /></button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {loadingHistory ? <Thinking text="Bolt AI está revisando tu contexto…" /> : messages.length === 0 ? (
              <div>
                <div className="rounded-[22px] bg-[linear-gradient(145deg,#111114,#292933)] p-5 text-white"><Sparkles size={20} className="text-[#8dbdff]" /><h3 className="mt-5 text-lg font-bold tracking-[-0.035em]">¿En qué te ayudo hoy?</h3><p className="mt-2 text-xs leading-5 text-white/60">Ya conozco tu plan, tu carrera objetivo y tus registros recientes.</p></div>
                <div className="mt-4 grid grid-cols-2 gap-2">{starters.map((starter) => <button key={starter} type="button" onClick={() => void submitMessage(starter)} className="min-h-14 cursor-pointer rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-left text-[11px] leading-4 font-semibold hover:border-accent/25">{starter}</button>)}</div>
              </div>
            ) : <div className="space-y-4">{messages.map((message) => <ChatMessage key={message.id} message={message} />)}</div>}
            {proposal && <PlanChangeCard proposal={proposal} loading={loading} onApply={applyProposal} onReject={rejectProposal} />}
            {!proposal && suggestedPrompts.length > 0 && !loading && <div className="mt-4 flex flex-wrap gap-2">{suggestedPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void submitMessage(prompt)} className="min-h-9 rounded-xl border border-accent/15 bg-accent-soft px-3 text-left text-[10px] font-bold text-accent">{prompt}</button>)}</div>}
            {loading && <Thinking text="Bolt AI está analizando tu entrenamiento…" />}
            {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-soft p-3.5 text-xs leading-5 font-medium text-danger">{error}</p>}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-line/80 bg-white p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-[20px] border border-line bg-surface-subtle p-2 pl-4 focus-within:border-accent/35">
              <textarea disabled={loadingHistory} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitMessage(input); } }} rows={1} maxLength={2000} placeholder="Pregúntale a Bolt AI…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-5 placeholder:text-muted/55 disabled:opacity-50" />
              <button type="submit" disabled={!input.trim() || loading || loadingHistory} aria-label="Enviar mensaje" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-white disabled:opacity-40">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUp size={18} />}</button>
            </div>
          </form>
        </section>
      </div>}
    </>
  );
}

function ChatMessage({ message }: { message: BoltMessage }) {
  if (message.role === "user") return <div className="ml-10 rounded-[20px] rounded-br-md bg-accent px-4 py-3 text-sm leading-5 text-white">{message.content}</div>;
  const metadata = message.metadata;
  const title = typeof metadata.title === "string" ? metadata.title : "Bolt AI";
  const relevantData = Array.isArray(metadata.relevantData) ? metadata.relevantData.filter((item): item is string => typeof item === "string") : [];
  const recommendation = typeof metadata.recommendation === "string" ? metadata.recommendation : null;
  const safetyNotice = typeof metadata.safetyNotice === "string" ? metadata.safetyNotice : null;
  return <article className="mr-4 rounded-[22px] rounded-bl-md border border-line bg-white p-4 shadow-sm"><p className="text-[10px] font-bold tracking-[.1em] text-accent uppercase">{title}</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{message.content}</p>{relevantData.length > 0 && <ul className="mt-3 space-y-1.5 rounded-2xl bg-surface-subtle p-3 text-xs text-muted">{relevantData.map((item) => <li key={item}>• {item}</li>)}</ul>}{recommendation && <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-5 font-semibold">{recommendation}</p>}{safetyNotice && <p className="mt-3 rounded-xl bg-warning-soft p-3 text-[11px] leading-5 text-warning">{safetyNotice}</p>}</article>;
}

function PlanChangeCard({ proposal, loading, onApply, onReject }: { proposal: BoltPlanChangePreview; loading: boolean; onApply: () => void; onReject: () => void }) {
  return <section className="mt-4 rounded-[22px] border border-accent/20 bg-accent-soft/55 p-4"><p className="text-[10px] font-bold tracking-[.1em] text-accent uppercase">Cambio propuesto</p><p className="mt-2 text-sm font-bold">{proposal.summary}</p><div className="mt-3 grid grid-cols-2 gap-2"><div className="space-y-2"><p className="px-1 text-[9px] font-bold text-muted uppercase">Antes</p>{proposal.previousPlan.length ? proposal.previousPlan.map((session) => <SessionPreview key={`before-${session.date}-${session.title}`} session={session} />) : <SessionPreview session={null} />}</div><div className="space-y-2"><p className="px-1 text-[9px] font-bold text-muted uppercase">Después</p>{proposal.newPlan.length ? proposal.newPlan.map((session) => <SessionPreview key={`after-${session.date}-${session.title}`} session={session} />) : <SessionPreview session={null} />}</div></div><p className="mt-3 text-[11px] leading-5 text-muted"><strong>Motivo:</strong> {proposal.reason}</p><p className="mt-2 text-[10px] leading-4 text-muted">Nada cambiará hasta que lo confirmes.</p>{proposal.status === "proposed" ? <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={loading} onClick={onApply} className="min-h-11 rounded-2xl bg-ink px-3 text-xs font-bold text-white">Aplicar cambio</button><button type="button" disabled={loading} onClick={onReject} className="min-h-11 rounded-2xl border border-line bg-white px-3 text-xs font-bold text-muted">No cambiar</button></div> : <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-success"><Check size={15} /> Cambio aplicado</p>}</section>;
}

function SessionPreview({ session }: { session: BoltPlanSession | null }) {
  return <div className="rounded-2xl bg-white p-3">{session ? <><p className="text-[9px] font-bold text-muted">{session.date}</p><p className="mt-1.5 text-xs font-bold">{session.title}</p><p className="mt-1 text-[10px] text-muted">{session.distanceKm === null ? "Sin distancia" : `${session.distanceKm} km`} · {session.targetRpeText ?? "RPE —"}</p></> : <p className="text-xs font-semibold text-muted">Sin sesión</p>}</div>;
}

function Thinking({ text }: { text: string }) { return <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface-subtle p-3.5 text-xs font-semibold text-muted"><LoaderCircle size={16} className="animate-spin text-accent" /> {text}</div>; }

function contextFromPath(pathname: string): WidgetContext {
  if (pathname === "/dashboard") return { type: "dashboard", refId: null };
  if (pathname.startsWith("/plan")) return { type: "plan", refId: null };
  if (pathname.startsWith("/progress")) return { type: "progress", refId: null };
  if (pathname.startsWith("/guide")) return { type: "guide", refId: null };
  const workoutMatch = pathname.match(/^\/workouts\/([0-9a-f-]{36})$/i);
  if (workoutMatch) return { type: "workout", refId: workoutMatch[1] };
  return { type: "global", refId: null };
}

function findLastPlanChangeId(messages: BoltMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const value = messages[index].metadata.planChangeId;
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function getLastSuggestedPrompts(messages: BoltMessage[]): string[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role !== "assistant") continue;
    const value = messages[index].metadata.suggestedPrompts;
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").slice(0, 4);
  }
  return [];
}
