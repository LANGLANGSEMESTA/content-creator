import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { product, description, target, price, style, image } = req.body;

    let imageDescription = "";

    // 🔥 1. VISION (kalau ada gambar)
    if (image) {
      try {
        const vision = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Deskripsikan produk ini secara detail untuk marketing." },
                {
                  type: "image_url",
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],
        });

        imageDescription = vision.choices[0].message.content;
      } catch (err) {
        console.error("VISION ERROR:", err.message);
      }
    }

    const finalDescription = description || imageDescription;

    // 🔥 2. GENERATE SCRIPT
    const prompt = `
Kamu adalah content creator TikTok profesional.

Produk: ${product}
Deskripsi: ${finalDescription}
Target: ${target}
Harga: ${price}
Style: ${style}

WAJIB gunakan format ini:

[STORY]
1. ...
2. ...
3. ...
4. ...
5. ...

[IMAGE]
1. ...
2. ...
3. ...
4. ...
5. ...

[VIDEO]
1. ...
2. ...
3. ...
4. ...
5. ...

[NARASI]
...

[CAPTION]
...
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;

    // 🔥 3. AMBIL IMAGE PROMPTS
    const imageSection = text.split("[IMAGE]")[1]?.split("[VIDEO]")[0] || "";

    const prompts = imageSection
      .split("\n")
      .map((p) => p.replace(/^\d+\.\s*/, "").trim())
      .filter((p) => p.length > 0)
      .slice(0, 5);

    // 🔥 4. GENERATE GAMBAR + DEBUG
    const images = [];

    for (let p of prompts) {
      try {
        const img = await openai.images.generate({
          model: "gpt-image-1",
          prompt: p,
          size: "1024x1024",
        });

        images.push(img.data?.[0]?.url || null);

      } catch (err) {
        console.error("IMAGE ERROR:", err.message);

        // 🔥 fallback biar tetap ada output
        images.push("ERROR: " + err.message);
      }
    }

    // 🔥 RESPONSE FINAL
    res.status(200).json({
      result: text,
      images,
    });

  } catch (error) {
    console.error("MAIN ERROR:", error.message);

    res.status(500).json({
      error: error.message,
    });
  }
}