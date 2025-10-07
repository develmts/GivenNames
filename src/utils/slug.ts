// Versio 4

// src/v4/utils/slug.ts
import { shortUUID } from "@/utils/uuid.js";

type SlugOpts = {
  mode?: "filename" | "url";
  maxLen?: number;
  keepCase?: boolean;
  fallbackPrefix?: string;
};

/**  Decodiding percent-encodings (ex: %C3%A9 → é) */
function decodePercentSequences(s: string): string {
  // capturing continuous blocks and tru decoding full block
  return s.replace(/(?:%[0-9A-Fa-f]{2})+/g, (seq) => {
    try { return decodeURIComponent(seq); } catch { return seq; }
  });
}

function robustDecodePercent(s: string, maxRounds = 3): string {
  let curr = s;
  for (let i = 0; i < maxRounds; i++) {
    let changed = false;

    // 1) Global try: can fail if incomplete % blocks
    try {
      const dec = decodeURIComponent(curr);
      if (dec !== curr) { curr = dec; changed = true; }
    } catch { /* ignore */ }

    // 2) Decode per blocs %xx%yy... curated
    const next = curr.replace(/(?:%[0-9A-Fa-f]{2})+/g, (seq) => {
      try { 
        const dec = decodeURIComponent(seq);
        if (dec !== seq) changed = true;
        return dec;
      } catch { return seq; }
    });

    if (!changed && next === curr) break;
    curr = next;
  }
  // console.log(`Decoding ${s} to ${curr}`)
  return curr;
}

export function slugify(input: string, opts: SlugOpts = {}): string {
  const { mode = "filename", maxLen = 150, keepCase = false, fallbackPrefix = "seed" } = opts;

  if (!input) return `${fallbackPrefix}_${shortUUID()}`;

  const isLikelyURL = /^[a-z]+:\/\//i.test(input) || /^www\./i.test(input); 

  // 0) Decodiding percent-encodings (ex: %C3%A9 → é)

  let s= robustDecodePercent(input)

  // 1) Normalitza i treu diacrítics
  //s = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // console.log("Normalized", s)
  if (!keepCase) s = s.toLowerCase();

  // 2) Simplifica URL (treu esquema)
  s = s.replace(/^[a-z]+:\/\//i, "");
  

  // 3) Converteix no [a-z0-9_.-] a guió  (→ ara permetem '.')
  s = s.replace(/[^a-z0-9_.-]+/gi, "-");
 
  // 4) Collapsa guions i treu extrems
  s = s.replace(/-+/g, "-").replace(/^[-_]+|[-_]+$/g, "");
 
  // 4bis) (opcional) Collapsa sèries de punts i evita punts al principi
  s = s.replace(/\.{2,}/g, ".").replace(/^\.+/, "");
  
  if (mode === "filename") {
    // 5) Filtra caràcters no vàlids a Windows + punts/espais finals
    s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\.+$/g, "").replace(/\s+$/g, "");

    // 6) disallow reserved names
    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    // console.log("no reservats", s)
    if (!s || reserved.test(s)) return `${fallbackPrefix}_${shortUUID()}`.slice(0, maxLen);
  }

  // 07 extra Fallback only if it seems an URL and result is naked domain name
  if (isLikelyURL && s.includes(".") && !s.includes("-")) {   
    const base = s.replace(/\./g, "-");
    s = `${base}-fallback-${shortUUID()}`;
  }

  // 08 fallback is empty
  if (!s) {
    s =  `${fallbackPrefix}_${shortUUID()}`;
  }
  
  // 09 Cuts if too long , after de rest of processing
  if (s.length > maxLen) {
    s = s.slice(0, maxLen);
  }

  return s;
}


// Helper Funcs 

export function isWindowsSafeFilename(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) return false;  // forbiden Chars
  if (/[. ]$/.test(name)) return false;                   // end space or dot
  if (isWindowsReservedName(name)) return false;          // reserved Names
  return true;
}

/** Windows Reserved names (case-insensitive). */
function isWindowsReservedName(name: string): boolean {
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name);
}


/* ===========================================================
   TEST INTEGRAT
   -----------------------------------------------------------
   - No s’executa automàticament.
   - Retorna { total, passed, failed, details[] }.
   - Si log=true, imprimeix diagnòstic.
   Ús:
     import { selfTestSlugify } from "./utils/slug";
     const res = selfTestSlugify(true);
     process.exit(res.failed ? 1 : 0);
   =========================================================== */

// DEPRECATED. test funcionality moved to Jest testint framework
// all the checks in this funcioin moved there

// export function selfTestSlugify(log = false) {
//   type Case = {
//     input: string;
//     opts?: SlugOpts;
//     expect?: string;
//     assert?: (out: string) => boolean;
//     label?: string;
//   };

//   const cases: Case[] = [
//     {
//       label: "simple: paraula neta",
//       input: "Alicia",
//       expect: "alicia",
//     },
//     {
//       label: "diacrítics: es treuen",
//       input: "María-Luisa",
//       expect: "maria-luisa",
//     },
//     {
//       label: "url bàsica",
//       input: "https://example.com/Alpha Beta?x=1",
//       expect: "example.com-alpha-beta-x-1",
//     },
//     {
//       label: "trailing dot i caràcters prohibits",
//       input: 'name <> with * bad : chars.',
//       assert: (out) => isWindowsSafeFilename(out) && !/[. ]$/.test(out),
//     },
//     {
//       label: "nom reservat: CON",
//       input: "CON",
//       assert: (out) => isWindowsSafeFilename(out) && out.toLowerCase() !== "con",
//     },
//     {
//       label: "buit: fallback a UUID",
//       input: "",
//       assert: (out) => isWindowsSafeFilename(out) && out.length > 0,
//     },
//     {
//       label: "només puntuació: fallback",
//       input: ".....",
//       assert: (out) => isWindowsSafeFilename(out) && out.length > 0,
//     },
//     {
//       label: "llarg: retall a maxLen",
//       input: "x".repeat(400),
//       opts: { maxLen: 40 },
//       assert: (out) => out.length === 40 && isWindowsSafeFilename(out),
//     },
//     {
//       label: "idioma no llatí: transliteració bàsica",
//       input: "Τζώρτζιος", // grec
//       assert: (out) => isWindowsSafeFilename(out) && out.length > 0,
//     },
//     {
//       label: "keepCase=true no forçar minúscules (excepte sanitització)",
//       input: "MiXed-CASE_Name",
//       opts: { keepCase: true },
//       assert: (out) => /MiXed-CASE_Name/i.test(out) || out.toLowerCase() === "mixed-case_name",
//     },
//     {
//       label: "mode=url no aplica check de Windows (però manté normalització)",
//       input: "https://foo/bar?Q=1",
//       opts: { mode: "url" },
//       expect: "foo-bar-q-1",
//     },
//     {
//       label: "percent-encoded simple (à)",
//       input: "catal%C3%A0",
//       expect: "catala",
//     },
//   ];

//   const details: { label: string; input: string; output: string; ok: boolean; note?: string }[] = [];

//   for (const c of cases) {
//     const out = slugify(c.input, c.opts);
//     let ok: boolean;

//     if (typeof c.expect === "string") {
//       ok = out === c.expect;
//     } else if (typeof c.assert === "function") {
//       ok = safeAssert(() => c.assert!(out));
//     } else {
//       // per defecte: ha de ser segur en Windows en mode filename
//       const mode = c.opts?.mode ?? "filename";
//       ok = mode === "filename" ? isWindowsSafeFilename(out) : out.length > 0;
//     }

//     details.push({ label: c.label ?? c.input, input: c.input, output: out, ok });
//   }

//   const passed = details.filter(d => d.ok).length;
//   const failed = details.length - passed;

//   if (log) {
//     for (const d of details) {
//       const mark = d.ok ? "✅" : "❌";
//       console.log(`${mark} ${d.label}\n   in: ${JSON.stringify(d.input)}\n  out: ${d.output}\n`);
//     }
//     console.log(`Result: ${passed}/${details.length} passed, ${failed} failed`);
//   }

//   return { total: details.length, passed, failed, details };
// }

function safeAssert(fn: () => boolean): boolean {
  try { return !!fn(); } catch { return false; }
}

