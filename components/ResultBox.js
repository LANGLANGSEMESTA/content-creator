export default function ResultBox({ title, content }) {
  const copy = () => {
    navigator.clipboard.writeText(content);
    alert("Copied!");
  };

  return (
    <div className="box">
      <h3>{title}</h3>
      <pre>{content}</pre>
      <button onClick={copy}>Copy</button>
    </div>
  );
}
