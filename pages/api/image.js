import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt } = req.body;
    const response = await openai.images.generate({
      model: "gpt-image-1-mini",
      prompt: `${prompt}, vertical 9:16, realistic photography, tiktok style, no text`,
      size: "1024x1792",
    });
    return res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
