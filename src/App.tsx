import { useState } from "react";

// Definição da estrutura do GPS para o TypeScript
interface GPSLocation {
  lat: number;
  lng: number;
}

export default function App() {
  const [driver, setDriver] = useState<string>("");
  const [plate, setPlate] = useState<string>("");
  const [invoice, setInvoice] = useState<string>("");
  const [status, setStatus] = useState<string>("entregue");
  const [comments, setComments] = useState<string>("");
  const [gps, setGps] = useState<GPSLocation | null>(null);
  const [base64Image, setBase64Image] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  // LINK ATIVO DO GOOGLE APPS SCRIPT
  const API_URL = "https://script.google.com/macros/s/AKfycbzW5hjaTMYcfE6qOt_923vTBrD9fBVEHDoqc9wLkiv3cBRGNeNhpjS-H39biU7K-2TU/exec";

  const obterGps = () => {
    if (!navigator.geolocation) {
      alert("GPS não suportado pelo seu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        alert("📍 GPS Capturado com Sucesso!");
      },
      () => alert("Erro ao capturar GPS. Ative a localização no seu aparelho.")
    );
  };

  const handleFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        const max = 1200; // Limite de tamanho para compactar a foto
        if (w > h && w > max) { h *= max / w; w = max; }
        else if (h > max) { w *= max / h; h = max; }
        canvas.width = w;
        canvas.height = h;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setBase64Image(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
        }
      };
      if (evt.target?.result) {
        img.src = evt.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const enviar = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    
    try {
      // Envio direto ao Google Apps Script
      const res = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        redirect: "follow", // 👉 ESSENCIAL: Segue o redirecionamento do Google
        headers: { 
          "Content-Type": "text/plain" // 👉 SOLUÇÃO DO ERRO: Evita o bloqueio de segurança CORS do navegador
        },
        body: JSON.stringify({
          driverName: driver,
          vehiclePlate: plate,
          invoice: invoice,
          status: status,
          comments: comments,
          gps: gps ? `${gps.lat}, ${gps.lng}` : "Não coletado",
          imageBase64: base64Image
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Ocorrência enviada com sucesso!");
        setInvoice("");
        setComments("");
        setPreview(null);
        setBase64Image("");
      } else {
        setMsg("❌ Erro: " + (data.message || data.error));
      }
    } catch (error) {
      console.error(error);
      setMsg("❌ Erro ao conectar ao servidor do Google. Verifique sua conexão de rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 450, margin: "20px auto", padding: 20, fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#fff", borderRadius: 12 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20, color: "#10b981" }}>Grupoprima Logística</h2>
      
      {msg && (
        <div style={{ padding: 10, borderRadius: 6, backgroundColor: msg.includes("✅") ? "#064e3b" : "#7f1d1d", color: "#fff", marginBottom: 15, textAlign: "center" }}>
          {msg}
        </div>
      )}
      
      <form onSubmit={enviar}>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Nome do Motorista</label>
        <input 
          placeholder="Ex: João Silva" 
          value={driver} 
          onChange={e => setDriver(e.target.value)} 
          required 
          style={{ width: "100%", margin: "4px 0 12px 0", padding: 10, boxSizing: "border-box", borderRadius: 6, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#fff" }} 
        />

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Placa do Veículo</label>
        <input 
          placeholder="Ex: ABC1234" 
          value={plate} 
          onChange={e => setPlate(e.target.value.toUpperCase())} 
          required 
          style={{ width: "100%", margin: "4px 0 12px 0", padding: 10, boxSizing: "border-box", borderRadius: 6, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#fff" }} 
        />

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Nota Fiscal (Apenas números)</label>
        <input 
          placeholder="Ex: 12345" 
          type="number" 
          value={invoice} 
          onChange={e => setInvoice(e.target.value)} 
          required 
          style={{ width: "100%", margin: "4px 0 12px 0", padding: 10, boxSizing: "border-box", borderRadius: 6, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#fff" }} 
        />

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Status da Entrega</label>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          style={{ width: "100%", margin: "4px 0 12px 0", padding: 10, boxSizing: "border-box", borderRadius: 6, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#fff" }}
        >
          <option value="entregue">Entregue</option>
          <option value="avaria">Avaria</option>
          <option value="recusado">Recusado</option>
        </select>

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Observações / Detalhes (Opcional)</label>
        <textarea 
          placeholder="Ex: Cliente recusou por atraso..." 
          value={comments} 
          onChange={e => setComments(e.target.value)} 
          rows={3}
          style={{ width: "100%", margin: "4px 0 12px 0", padding: 10, boxSizing: "border-box", borderRadius: 6, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#fff", resize: "none" }} 
        />

        <button 
          type="button" 
          onClick={obterGps} 
          style={{ width: "100%", margin: "8px 0 16px 0", padding: 10, borderRadius: 6, border: "none", backgroundColor: gps ? "#065f46" : "#475569", color: "#fff", cursor: "pointer", fontWeight: "bold" }}
        >
          {gps ? "📍 GPS Coletado!" : "📍 Capturar GPS de Auditoria"}
        </button>

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Foto do Canhoto / Ocorrência</label>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFile} 
          style={{ width: "100%", margin: "8px 0 16px 0" }} 
        />

        {preview && (
          <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <img src={preview} alt="Preview" style={{ width: "100%", height: 200, objectFit: "cover" }} />
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: "100%", background: "#10b981", color: "#fff", padding: 14, border: "none", borderRadius: 6, fontWeight: "bold", fontSize: 16, cursor: "pointer" }}
        >
          {loading ? "Processando e Enviando..." : "Enviar Ocorrência à Central 🚀"}
        </button>
      </form>
    </div>
  );
}