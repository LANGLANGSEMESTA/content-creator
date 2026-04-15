import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { product, description, target, price, style, image } = req.body;

    let imageDescription = "";

    // 🔥 kalau ada gambar → pakai AI vision
    if (image) {
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
                  url: image, // base64 langsung dari frontend
                },
              },
            ],
          },
        ],
      });

      imageDescription = vision.choices[0].message.content;
    }

    const finalDescription = description || imageDescription;

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

    res.status(200).json({
      result: completion.choices[0].message.content,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}