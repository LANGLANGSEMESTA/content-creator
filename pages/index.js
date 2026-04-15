import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({ product: "", description: "" });
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setImages([]);
    setProgress("Sedang menyusun naskah...");

    try {
      // Step 1: Ambil Teks & Daftar Prompt
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      const get = (tag) => {
        const reg = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[|$)`, "i");
        return json.result.match(reg)?.[1]?.trim() || "";
      };

      setData({ story: get("STORY"), narasi: get("NARASI"), caption: get("CAPTION") });
      
      // Step 2: Generate Gambar Satu per Satu (Agar tidak timeout di Vercel)
      const tempImages = [];
      for (let i = 0; i < json.prompts.length; i++) {
        setProgress(`Menggambar scene ${i + 1} dari ${json.prompts.length}...`);
        const imgRes = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: json.prompts[i] }),
        });
        const imgJson = await imgRes.json();
        if (imgJson.url) {
          tempImages.push(imgJson.url);
          setImages([...tempImages]); // Update UI langsung tiap satu gambar selesai
        }
      }
      setProgress("Selesai!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>TikTok AI (Anti-Timeout Version) 🚀</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Nama Produk" onChange={e => setForm({...form, product: e.target.value})} required style={{padding:10, marginRight:10}} />
        <button type="submit" disabled={loading}>{loading ? "Proses..." : "Mulai Jualan"}</button>
      </form>
      
      <p style={{color: "blue"}}>{progress}</p>

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div style={{ background: "#f9f9f9", padding: 15 }}>
            <h3>Script:</h3>
            <p><strong>Voice Over:</strong> {data.narasi}</p>
            <p><strong>Caption:</strong> {data.caption}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {images.map((url, i) => (
              <img key={i} src={url} width="100%" style={{ borderRadius: 8, border: "2px solid #000" }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}