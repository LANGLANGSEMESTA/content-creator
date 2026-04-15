import { useState } from "react";
import ResultBox from "../components/ResultBox";

export default function Home() {
  const [form, setForm] = useState({
    product: "",
    description: "",
    target: "",
    price: "",
    style: "soft"
  });

  const [image, setImage] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  // 🔥 parser hasil AI
  const parseResult = (text) => {
    const get = (start, end) => {
      const regex = new RegExp(`${start}([\\s\\S]*?)${end}`, "i");
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };

    return {
      story: get("\\[STORY\\]", "\\[IMAGE\\]"),
      image: get("\\[IMAGE\\]", "\\[VIDEO\\]"),
      video: get("\\[VIDEO\\]", "\\[NARASI\\]"),
      narration: get("\\[NARASI\\]", "\\[CAPTION\\]"),
      caption: get("\\[CAPTION\\]", "$")
    };
  };

  const generate = async () => {
    setLoading(true);

    let base64Image = "";

    // 🔥 convert image ke base64
    if (image) {
      const reader = new FileReader();
      base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(image);
      });
    }

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        image: base64Image
      })
    });

    const result = await res.json();

    // 🔥 pakai parser
    const parsed = parseResult(result.result || "");

    setData(parsed);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>🔥 AI TikTok Generator PRO</h1>

      <input type="file" onChange={handleImage} />

      <input name="product" placeholder="Nama Produk" onChange={handleChange} />
      <input name="description" placeholder="Deskripsi Produk (opsional)" onChange={handleChange} />
      <input name="target" placeholder="Target Market" onChange={handleChange} />
      <input name="price" placeholder="Harga" onChange={handleChange} />

      <select name="style" onChange={handleChange}>
        <option value="soft">Soft Selling</option>
        <option value="hard">Hard Selling</option>
        <option value="story">Storytelling</option>
      </select>

      <button onClick={generate}>
        {loading ? "Generating..." : "Generate 🚀"}
      </button>

      {data && (
        <>
          <ResultBox title="Story Arc" content={data.story} />
          <ResultBox title="Image Prompts" content={data.image} />
          <ResultBox title="Video Prompts" content={data.video} />
          <ResultBox title="Narasi" content={data.narration} />
          <ResultBox title="Caption + Hashtag" content={data.caption} />
        </>
      )}
    </div>
  );
}