import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { product, description, image } = req.body;
    if (!product) return res.status(400).json({ error: "Nama produk wajib isi" });

    let finalDesc = description;
    if (image && !description) {
      const vision = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Describe this product." },
            { type: "image_url", image_url: { url: image } }
          ]
        }]
      });
      finalDesc = vision.choices[0].message.content;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Buat konten TikTok: ${product}. Deskripsi: ${finalDesc}. 
        Format JSON: {"narasi": "...", "caption": "...", "prompts": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]}`
      }],
      response_format: { type: "json_object" }
    });

    return res.status(200).json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
