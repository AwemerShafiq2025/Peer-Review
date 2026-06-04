"use client";

import { useRef, useState } from "react";
import type { Quartile } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf";
import { IconCheck, IconDoc, IconUpload, Spinner } from "./icons";

const MIN_CHARS = 300;
const WARN_CHARS = 50_000;
const MAX_CHARS = 60_000;

const QUARTILES: { id: Quartile; label: string; desc: string; tooltip: string }[] = [
  {
    id: "Q1",
    label: "Q1",
    desc: "Top-tier - novelty + rigor + impact",
    tooltip:
      "Nature, Science, Cell-level journals. Top 25% by impact factor. Extremely competitive - breakthrough work only.",
  },
  {
    id: "Q2",
    label: "Q2",
    desc: "Strong - solid, useful advance",
    tooltip: "Strong field journals. Top 25-50%. Solid novel contributions welcome.",
  },
  {
    id: "Q3",
    label: "Q3",
    desc: "Respectable - correct & honest",
    tooltip: "Respectable journals. Top 50-75%. Sound, honest work accepted.",
  },
  {
    id: "Q4",
    label: "Q4",
    desc: "Entry-level - sound & complete",
    tooltip: "Entry-level journals. Bottom 25%. Correctness over novelty.",
  },
];

const SAMPLE_PAPER = `Title: EfficientPrune: Structured Magnitude Pruning for Transformer-Based Language Models

Abstract
Transformer-based language models deliver strong performance across summarization, retrieval, and code assistance, but their deployment cost remains prohibitive for small laboratories and edge services. We present EfficientPrune, a structured magnitude pruning method that removes attention heads, feed-forward blocks, and low-contribution projection channels while preserving tensor shapes that are friendly to commodity inference runtimes. Unlike unstructured sparsity approaches, EfficientPrune requires no custom kernels and can be applied after supervised fine-tuning. On a 1.3B parameter decoder-only model, our method reduces active parameters by 38% and lowers median latency by 31% on a single L4 GPU, with a 1.8 point average drop across six language understanding benchmarks.

Introduction
Recent language models have improved accuracy by scaling depth, width, and training data. This trend has created a practical gap between research prototypes and deployable systems. Many users do not need maximal benchmark performance; they need a model that is affordable, predictable, and accurate enough for a specific domain. Compression methods such as distillation, quantization, and pruning address this gap, but each has trade-offs. Distillation requires training a smaller student model, quantization can introduce hardware-specific issues, and unstructured pruning often fails to translate theoretical sparsity into wall-clock speedups.

Methods
EfficientPrune scores structural units using normalized weight magnitude combined with a calibration loss measured on 2,000 domain-balanced examples. We prune in three stages: attention heads, feed-forward expansion channels, and output projection channels. After each stage, we run 1,500 steps of recovery fine-tuning using a mixture of general instruction data and task-specific examples. The pruning ratio is selected by a validation curve that stops when perplexity increases by more than 4% relative to the fine-tuned baseline.

Results
We evaluate EfficientPrune on BoolQ, ARC-Challenge, HellaSwag, WinoGrande, GSM8K, and a proprietary scientific abstract classification task. The baseline model averages 63.4 across public benchmarks and reaches 81.2 F1 on the scientific task. EfficientPrune at 38% parameter reduction averages 61.6 and reaches 80.1 F1. Inference latency falls from 142 ms/token to 98 ms/token at batch size 8, while peak memory decreases from 9.8 GB to 6.4 GB. Compared with random structured pruning at the same budget, EfficientPrune improves average benchmark performance by 5.7 points.

Conclusion
EfficientPrune offers a practical compression path for transformer language models when deployment efficiency matters more than preserving every fraction of benchmark accuracy. The method is simple to implement, compatible with standard dense inference libraries, and especially useful for domain-specific assistants. Future work will study multilingual models, interaction with quantization, and whether calibration examples can be selected automatically from deployment logs.`;

function charStatus(chars: number) {
  if (chars < MIN_CHARS) {
    return {
      bar: "bg-rose-400",
      text: "text-rose-300",
      label: "Need at least 300 characters",
    };
  }
  if (chars < WARN_CHARS) {
    return {
      bar: "bg-emerald-400",
      text: "text-emerald-300",
      label: `${chars.toLocaleString()} characters`,
    };
  }
  if (chars <= MAX_CHARS) {
    return {
      bar: "bg-amber-400",
      text: "text-amber-300",
      label: "Approaching limit - text will be trimmed at 60,000 characters",
    };
  }

  return {
    bar: "bg-rose-400",
    text: "text-rose-300",
    label: "Text exceeds 60,000 character limit and will be trimmed. Consider using key sections only.",
  };
}

export default function UploadForm({
  busy,
  onSubmit,
  isLoggedIn = true,
}: {
  busy: boolean;
  onSubmit: (paperText: string, quartile: Quartile) => void;
  isLoggedIn?: boolean;
}) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState("");
  const [paperText, setPaperText] = useState("");
  const [pasted, setPasted] = useState("");
  const [quartile, setQuartile] = useState<Quartile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const text = mode === "file" ? paperText : pasted;
  const chars = text.trim().length;
  const ready = isLoggedIn && chars >= MIN_CHARS && !!quartile && !busy && !extracting;
  const charInfo = charStatus(chars);
  const charProgress = Math.min(100, (chars / MAX_CHARS) * 100);

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError('Please upload a PDF file, or switch to "Paste text".');
      return;
    }
    setFileName(file.name);
    setSampleLoaded(false);
    setExtracting(true);
    setProgress("Opening PDF...");
    try {
      const extracted = await extractPdfText(file, (p, t) =>
        setProgress(`Extracting text - page ${p} of ${t}`)
      );
      if (extracted.trim().length < MIN_CHARS) {
        setError(
          'Could not extract enough text from this PDF (it may be scanned images). Try the "Paste text" option.'
        );
        setPaperText("");
      } else {
        setPaperText(extracted);
        setProgress(`Extracted ${extracted.length.toLocaleString()} characters from ${file.name}`);
      }
    } catch (e: any) {
      setError(`Failed to read PDF: ${e?.message ?? "unknown error"}. Try pasting the text instead.`);
      setPaperText("");
    } finally {
      setExtracting(false);
    }
  }

  function submit() {
    setError(null);
    if (!isLoggedIn) {
      setError("Please sign in to use the review panel.");
      return;
    }
    if (chars < MIN_CHARS) {
      setError("Please provide the manuscript text (at least ~300 characters).");
      return;
    }
    if (!quartile) {
      setError("Select the target journal quartile.");
      return;
    }
    onSubmit(text.trim(), quartile);
  }

  function loadSamplePaper() {
    setMode("paste");
    setPasted(SAMPLE_PAPER);
    setQuartile("Q2");
    setError(null);
    setSampleLoaded(true);
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-pill bg-accent/15 text-xs font-bold text-accent">
          1
        </span>
        <h3 className="font-semibold">Your manuscript</h3>
      </div>

      <div className="mb-4 inline-flex rounded-pill border border-subtle p-1 text-sm">
        {(["file", "paste"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-pill px-4 py-1.5 transition-colors ${
              mode === m ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {m === "file" ? "Upload PDF" : "Paste text"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? "border-accent bg-accent/5" : "border-white/15 hover:border-white/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {extracting ? (
            <Spinner width={26} height={26} className="text-accent" />
          ) : fileName ? (
            <IconDoc width={26} height={26} className="text-accent" />
          ) : (
            <IconUpload width={26} height={26} className="text-text-tertiary" />
          )}
          <div>
            <p className="font-medium">{fileName ?? "Drop a PDF here or click to browse"}</p>
            <p className="mt-1 text-sm text-text-tertiary">
              {extracting
                ? progress
                : progress || "We extract the text in your browser - the file never leaves your device."}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && ready) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Paste the full manuscript text - title, abstract, methods, results, discussion..."
            rows={10}
            className="w-full resize-y rounded-md border border-subtle bg-base/60 p-4 text-sm leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
          />
          <p className="mt-2 text-xs text-text-tertiary">Tip: Press Ctrl+Enter to submit</p>
        </div>
      )}

      <div className="mt-3">
        <div className={`flex items-center justify-end gap-1.5 text-xs ${charInfo.text}`}>
          {chars >= MIN_CHARS && chars < WARN_CHARS && <IconCheck width={13} height={13} />}
          <span>{charInfo.label}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-white/10">
          <div
            className={`h-full rounded-pill transition-all duration-300 ${charInfo.bar}`}
            style={{ width: `${charProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={loadSamplePaper} className="btn-outline !px-4 !py-2 text-sm">
          Try a sample paper
        </button>
        {sampleLoaded && (
          <span className="rounded-pill bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
            Sample paper loaded - this is a fictional manuscript for demonstration
          </span>
        )}
      </div>

      <div className="mb-3 mt-6 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-pill bg-accent/15 text-xs font-bold text-accent">
          2
        </span>
        <h3 className="font-semibold">Target journal quartile</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 overflow-visible sm:grid-cols-4">
        {QUARTILES.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQuartile(q.id)}
            className={`group relative overflow-visible rounded-md border p-3 text-left transition-all ${
              quartile === q.id
                ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                : "border-subtle hover:border-white/25"
            }`}
          >
            <div className="flex items-center gap-1.5 font-mono text-lg font-bold">
              <span>{q.label}</span>
              <span className="grid h-4 w-4 place-items-center rounded-pill border border-white/20 text-[10px] font-sans text-text-tertiary">
                i
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 hidden w-64 -translate-x-1/2 rounded-md bg-surface px-3 py-2 text-xs leading-relaxed text-white shadow-card ring-1 ring-white/10 group-hover:block">
              {q.tooltip}
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-text-tertiary">{q.desc}</div>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-500/10 p-3 text-sm text-rose-300 ring-1 ring-rose-400/20">
          {error}
        </p>
      )}

      <button onClick={submit} disabled={!ready} className="btn-primary mt-6 w-full">
        {busy ? (
          <>
            <Spinner width={18} height={18} /> Review in progress...
          </>
        ) : (
          "Convene the review panel"
        )}
      </button>
      <p className="mt-3 text-center text-xs text-text-tertiary">
        Four independent reviewers + a handling editor - ~30-60 seconds
      </p>
    </div>
  );
}
