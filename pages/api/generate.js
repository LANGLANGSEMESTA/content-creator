import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      const { product, description, target, price, style } = fields;

      let imageDescription = "";

      // 🔥 kalau ada gambar → pakai AI vision
      if (files.image) {
        const imageFile = fs.readFileSync(files.image.filepath);
        const base64 = imageFile.toString("base64");

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
                    url: `data:image/jpeg;base64,${base64}`,
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

[STORY]
5 scene

[IMAGE]
5 prompt gambar

[VIDEO]
5 prompt video

[NARASI]
script 30-45 detik

[CAPTION]
caption + hashtag
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      res.status(200).json({
        result: completion.choices[0].message.content,
      });
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}