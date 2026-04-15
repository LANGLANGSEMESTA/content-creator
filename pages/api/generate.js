import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 10 scene storytelling TikTok
const SCENE_ROLES = [
  "Hook / Problem",
  "Agitasi",
  "Solusi Reveal",
  "Close Up Produk",
  "Demo / Cara Pakai",
  "Before vs After",
  "Social Proof",
  "Benefit Utama",
  "Benefit Kedua",
  "Call to Action",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("API CALLED");

    const { product, description, target, price, style, image } = req.body;

    if (!product) {
      return res.status(400).json({ error: "Nama produk wajib diisi." });
    }

    let imageDescription = "";

    // ✅ 1. VISION — hanya jika ada gambar
    if (image) {
      try {
        const vision = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 150,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Deskripsikan produk ini untuk marketing secara singkat dalam 2-3 kalimat.",
                },
                {
                  type: "image_url",
                  image_url: { url: image, detail: "low" },
                },
              ],
            },
          ],
        });
        imageDescription = vision.choices?.[0]?.message?.content || "";
      } catch (err) {
        console.error("VISION ERROR:", err.message);
      }
    }

    const finalDescription =
      description ||
      imageDescription ||
      "Produk menarik untuk kebutuhan sehari-hari";

    // ✅ 2. GENERATE SCRIPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: `
Buat konten TikTok marketing dalam Bahasa Indonesia.

Produk: ${product}
Deskripsi: ${finalDescription}
Target: ${target || "umum"}
Harga: ${price || "tidak disebutkan"}
Style: ${style || "soft"}

WAJIB gunakan FORMAT PERSIS ini (jangan ubah nama tag):

[STORY]
1. Hook/Problem: ...
2. Agitasi: ...
3. Solusi Reveal: ...
4. Close Up Produk: ...
5. Demo/Cara Pakai: ...
6. Before vs After: ...
7. Social Proof: ...
8. Benefit Utama: ...
9. Benefit Kedua: ...
10. Call to Action: ...

[IMAGE]
1. Hook/Problem: (deskripsi visual dalam bahasa Inggris untuk AI image generation)
2. Agitasi: (deskripsi visual dalam bahasa Inggris)
3. Solusi Reveal: (deskripsi visual dalam bahasa Inggris)
4. Close Up: (deskripsi visual dalam bahasa Inggris)
5. Demo: (deskripsi visual dalam bahasa Inggris)
6. Before vs After: (deskripsi visual dalam bahasa Inggris)
7. Social Proof: (deskripsi visual dalam bahasa Inggris)
8. Benefit Utama: (deskripsi visual dalam bahasa Inggris)
9. Benefit Kedua: (deskripsi visual dalam bahasa Inggris)
10. CTA: (deskripsi visual dalam bahasa Inggris)

[VIDEO]
Deskripsikan transisi, durasi tiap scene, dan music mood yang cocok.

[NARASI]
Script narasi lengkap yang bisa dibacakan saat video diputar.

[CAPTION]
Caption TikTok lengkap dengan hashtag.
`,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "";

    // ✅ 3. PARSE 10 IMAGE PROMPTS dari section [IMAGE]
    const imageSection = text.includes("[IMAGE]")
      ? text.split("[IMAGE]")[1]?.split("[VIDEO]")[0]
      : "";

    let prompts = (imageSection || "")
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*[\w\s\/]+:\s*/i, "").trim())
      .filter((p) => p.length > 10);

    // Fallback per scene kalau parse gagal
    const fallbackPrompts = [
      `frustrated person experiencing a problem that ${product} can solve, emotional expression, realistic`,
      `close up dramatic shot of the problem before using ${product}, moody lighting`,
      `${product} appearing as the hero solution, product reveal, clean bright background`,
      `macro close up detail shot of ${product}, beautiful texture, sharp focus`,
      `happy person using ${product} in everyday life, natural lifestyle setting`,
      `split comparison before and after results of using ${product}, dramatic transformation`,
      `group of diverse happy customers smiling with ${product}, social proof`,
      `${product} highlighting its main key benefit, bold visual, lifestyle context`,
      `${product} showing secondary feature or bonus benefit, clean aesthetic`,
      `${product} displayed with price and urgency, call to action, order now`,
    ];

    if (prompts.length < 5) {
      prompts = fallbackPrompts;
    }

    // Pastikan selalu 10
    prompts = prompts.slice(0, 10);
    while (prompts.length < 10) {
      prompts.push(fallbackPrompts[prompts.length] || `${product} TikTok marketing scene ${prompts.length + 1}`);
    }

    // ✅ 4. GENERATE 10 GAMBAR satu per satu — portrait TikTok 9:16
    const generatedImages = [];

    for (let i = 0; i < 10; i++) {
      const role = SCENE_ROLES[i];
      const prompt = prompts[i];

      try {
        const finalPrompt = `${prompt}, vertical 9:16 portrait orientation, TikTok short video style, cinematic lighting, high quality photography, no text, no watermark`;

        console.log(`Generating image ${i + 1}/10 [${role}]`);

        const img = await openai.images.generate({
          model: "dall-e-3",
          prompt: finalPrompt,
          size: "1024x1792",    // Portrait — cocok untuk TikTok
          quality: "standard",  // Standard = hemat, bukan hd
          n: 1,
        });

        generatedImages.push({
          url: img.data?.[0]?.url || null,
          scene: i + 1,
          role,
        });

      } catch (err) {
        console.error(`IMG ${i + 1} ERROR:`, err.message);
        generatedImages.push({ url: null, scene: i + 1, role });
      }
    }

    return res.status(200).json({
      result: text,
      images: generatedImages,
    });

  } catch (error) {
    console.error("MAIN ERROR:", error.message);
    return res.status(500).json({
      error: error.message || "Terjadi kesalahan server.",
    });
  }
}
