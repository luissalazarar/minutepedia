import OpenAI from "openai";
import { DEFAULT_SCRIPT_MODEL } from "./prompt";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function generateScript(topic: string) {
  mustEnv("OPENAI_API_KEY");

  const model = process.env.OPENAI_MODEL || "gpt-5.2";
  const prompt = DEFAULT_SCRIPT_MODEL.replace("{TEMA}", topic);

  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "Eres MinutePedia." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  const out = (res.choices?.[0]?.message?.content || "").trim();
  if (!out) throw new Error("OpenAI returned empty script.");
  return out;
}
