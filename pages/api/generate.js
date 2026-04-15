import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SCENE_ROLES = [
  "Hook / Problem", "Agitasi", "Solusi Reveal", "Close Up Produk",
  "Demo / Cara Pakai", "Before vs After", "Social Proof",
  "Benefit Utama", "Benefit Kedua", "Call to Action",
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { product, description, target, price, style, image } = req.body;
    if (!product) return res.status(400).json({ error: "Nama produk wajib diisi." });

    // 1. VISION - Deteksi deskripsi produk (Murah & Cepat)
    let imageDescription = "";
    if (image) {
      try {
        const vision = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 150,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Describe this product for marketing in 2 sentences." },
              { type: "image_url", image_url: { url: image, detail: "low" } },
            ],
          }],
        });
        imageDescription = vision.choices?.[0]?.message?.content || "";
      } catch (e) { console.error("Vision Error:", e.message); }
    }

    const finalDesc = description || imageDescription || "Produk berkualitas";

    // 2. GENERATE SCRIPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Buat konten TikTok marketing Bahasa Indonesia. Produk: ${product}. Deskripsi: ${finalDesc}. Target: ${target}. Harga: ${price}. Style: ${style}. 
        Gunakan format wajib: [STORY]...[IMAGE] (isi 10 baris deskripsi visual bahasa inggris saja) [VIDEO]...[NARASI]...[CAPTION]...`
      }],
    });

    const text = completion.choices?.[0]?.message?.content || "";

    // 3. PARSING PROMPTS
    const imagePart = text.split("[IMAGE]")[1]?.split("[VIDEO]")[0] || "";
    let prompts = imagePart.split("\n")
      .map(l => l.replace(/^\d+\.\s*/, "").trim())
      .filter(l => l.length > 10)
      .slice(0, 10);

    // Fallback jika parsing gagal
    while (prompts.length < 10) {
      prompts.push(`${product} in cinematic TikTok lighting, scene ${prompts.length + 1}`);
    }

    // 4. PARALLEL IMAGE GENERATION (Anti-Timeout)
    // Model: gpt-image-1-mini (Biaya $0.005/gambar)
    const imagePromises = prompts.map(async (prompt, i) => {
      try {
        const response = await openai.images.generate({
          model: "gpt-image-1-mini", 
          prompt: `${prompt}, vertical 9:16, realistic photography, tiktok content style, no text`,
          size: "1024x1792",
          n: 1,
        });
        return { url: response.data[0].url, scene: i + 1, role: SCENE_ROLES[i] };
      } catch (err) {
        console.error(`Error scene ${i+1}:`, err.message);
        return { url: null, scene: i + 1, role: SCENE_ROLES[i] };
      }
    });

    const results = await Promise.all(imagePromises);

    return res.status(200).json({ result: text, images: results });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}