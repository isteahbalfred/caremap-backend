import { Request, Response } from "express";
// ⚠️ Ajuste ce chemin vers l'emplacement réel de ton client Prisma
import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// Prompt système : explique au modèle QUAND et COMMENT utiliser les outils,
// et comment formater les liens directs vers les fiches CareMap.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Tu es l'assistant de CareMap, une plateforme médicale haïtienne qui recense pharmacies, cliniques et médicaments. Tu sers aussi bien les administrateurs (aide à l'utilisation de l'interface) que les utilisateurs finaux (recherche de médicaments, pharmacies, cliniques).

Tu réponds toujours en français, de façon concise et utile.

Tu as accès à des outils de recherche en temps réel (search_medications, search_pharmacies, search_clinics) connectés à la vraie base de données de CareMap. UTILISE-LES SYSTÉMATIQUEMENT dès qu'on te parle d'un médicament, d'une pharmacie ou d'une clinique précis — ne réponds JAMAIS de mémoire ou en inventant une disponibilité, un prix ou une adresse.

Règles de réponse :
1. Quand un élément est trouvé ET disponible, inclus toujours un lien Markdown vers sa fiche, en utilisant EXACTEMENT l'URL renvoyée par l'outil (champ "url" ou "mapUrl") — par exemple [Panadol](/medication/12) ou [Pharmacie Saint-Marc](/map?focus=pharmacy-4).
2. Si un médicament n'est disponible dans AUCUNE pharmacie (available: false ou liste de pharmacies vide), ne mets AUCUN lien. Explique clairement l'indisponibilité, puis propose une alternative : un équivalent générique si tu en connais un, ou invite la personne à cliquer sur "Proposer une alternative" ou à contacter une pharmacie pour une commande spéciale.
3. Si tu recommandes une pharmacie précise pour un médicament, utilise le lien "mapUrl" renvoyé par l'outil : il ouvre directement la carte avec l'itinéraire déjà calculé vers cette pharmacie.
4. Reste bref : privilégie quelques phrases ou une petite liste numérotée, pas de longs paragraphes.
5. Si on te demande comment utiliser l'interface CareMap, explique les étapes clairement sans avoir besoin d'un outil.`;

// ---------------------------------------------------------------------------
// Typage minimal de l'API Gemini (function calling inclus)
// ---------------------------------------------------------------------------
interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, any> };
  functionResponse?: { name: string; response: any };
}

interface GeminiResponse {
  candidates?: {
    content?: {
      role?: string;
      parts?: GeminiPart[];
    };
  }[];
}

// ---------------------------------------------------------------------------
// Déclaration des outils exposés au modèle
// ---------------------------------------------------------------------------
const tools = [
  {
    functionDeclarations: [
      {
        name: "search_medications",
        description:
          "Recherche des médicaments par nom ou nom générique et retourne leur disponibilité réelle (pharmacies, prix, quantités) depuis la base CareMap.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Nom ou partie du nom du médicament recherché" },
          },
          required: ["query"],
        },
      },
      {
        name: "search_pharmacies",
        description: "Recherche des pharmacies partenaires par nom ou ville.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Nom de pharmacie ou ville" },
          },
          required: ["query"],
        },
      },
      {
        name: "search_clinics",
        description: "Recherche des cliniques partenaires par nom ou ville.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Nom de clinique ou ville" },
          },
          required: ["query"],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Exécuteurs : interrogent Prisma et renvoient des données prêtes à citer,
// avec les URLs exactes que le modèle doit reproduire telles quelles.
// ⚠️ Adapte les noms de modèles/champs (medication, pharmacy, clinic, stocks,
// genericName, threshold...) à ton schema.prisma réel si besoin.
// ---------------------------------------------------------------------------
async function searchMedications(query: string) {
  const meds = await prisma.medication.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      category: true,
      stocks: { include: { pharmacy: true } },
    },
    take: 5,
  });

  return meds.map((m) => {
    const availableStocks = m.stocks.filter((s) => s.quantity > 0);
    return {
      id: m.id,
      name: m.name,
      genericName: m.genericName,
      category: m.category?.name ?? null,
      url: `/medication/${m.id}`,
      available: availableStocks.length > 0,
      minPrice:
        availableStocks.length > 0
          ? Math.min(...availableStocks.map((s) => Number(s.price)))
          : null,
      pharmacies: availableStocks.slice(0, 5).map((s) => ({
        id: s.pharmacy.id,
        name: s.pharmacy.name,
        city: s.pharmacy.city,
        phone: s.pharmacy.phone,
        price: Number(s.price),
        quantity: s.quantity,
        mapUrl: `/map?focus=pharmacy-${s.pharmacy.id}`,
      })),
    };
  });
}

async function searchPharmacies(query: string) {
  const pharmacies = await prisma.pharmacy.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  });
  return pharmacies.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    address: p.address,
    phone: p.phone,
    url: `/map?focus=pharmacy-${p.id}`,
  }));
}

async function searchClinics(query: string) {
  const clinics = await prisma.clinic.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  });
  return clinics.map((c) => ({
    id: c.id,
    name: c.name,
    city: c.city,
    address: c.address,
    phone: c.phone,
    url: `/map?focus=clinic-${c.id}`,
  }));
}

const TOOL_EXECUTORS: Record<string, (args: Record<string, any>) => Promise<any>> = {
  search_medications: (args) => searchMedications(args.query ?? ""),
  search_pharmacies: (args) => searchPharmacies(args.query ?? ""),
  search_clinics: (args) => searchClinics(args.query ?? ""),
};

// ---------------------------------------------------------------------------
// Appel Gemini (un tour de conversation)
// ---------------------------------------------------------------------------
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function callGemini(apiKey: string, contents: any[]): Promise<GeminiResponse> {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools,
      contents,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Erreur API Gemini:", response.status, errText);
    throw new Error("gemini_call_failed");
  }

  return (await response.json()) as GeminiResponse;
}

// ---------------------------------------------------------------------------
// Handler principal : boucle modèle <-> outils jusqu'à obtenir une réponse
// texte finale, avec un plafond pour éviter toute boucle infinie.
// ---------------------------------------------------------------------------
export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "Le message est requis." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY manquante dans les variables d'environnement.");
      return res.status(500).json({ success: false, error: "Configuration serveur incomplète." });
    }

    const contents: any[] = [{ role: "user", parts: [{ text: message }] }];

    const MAX_ROUNDS = 4; // nombre max d'aller-retours modèle <-> outils
    let finalText: string | null = null;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const data = await callGemini(apiKey, contents);
      const parts = data.candidates?.[0]?.content?.parts || [];
      const functionCallPart = parts.find((p) => p.functionCall);

      if (!functionCallPart) {
        finalText = parts.find((p) => p.text)?.text || null;
        break;
      }

      const { name, args } = functionCallPart.functionCall!;
      const executor = TOOL_EXECUTORS[name];
      const toolResult = executor
        ? await executor(args || {})
        : { error: `Outil inconnu: ${name}` };

      // On rejoue le tour du modèle (sa demande d'appel), puis on lui fournit
      // le vrai résultat issu de la base de données CareMap.
      contents.push({ role: "model", parts: [{ functionCall: { name, args } }] });
      contents.push({
        role: "function",
        parts: [{ functionResponse: { name, response: { result: toolResult } } }],
      });
    }

    const reply = finalText || "Désolé, je n'ai pas pu répondre.";
    return res.json({ success: true, data: { reply } });
  } catch (error) {
    console.error("Erreur chat controller:", error);
    return res.status(500).json({ success: false, error: "Erreur interne du serveur." });
  }
};