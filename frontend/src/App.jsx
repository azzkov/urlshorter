import { createSignal } from "solid-js";
import { Show } from "solid-js";
import "./App.css"; 

export default function App() {
  const [originalUrl, setOriginalUrl] = createSignal("");
  const [customSlug, setCustomSlug] = createSignal("");
  const [shortUrl, setShortUrl] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const shortenUrl = async () => {
    if (!originalUrl()) {
      setError("Por favor, informe uma URL válida.");
      return;
    }

    setError("");
    setIsLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: originalUrl(),
          customSlug: customSlug(),
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShortUrl(data.shortUrl);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="container">
      <div class="card">
        <div class="logo-container">
          <img src="/logo.png" alt="logo" width="80" />
        </div>
        
        <h1 class="title">Cansado de URLs longas?</h1>
        
        <p class="subtitle">
          Transforme URLs longas em links curtos e personalizáveis. Fácil, rápido e gratuito!
        </p>
        
        <div class="form-group">
          <label for="originalUrl" class="label">URL Original</label>
          <input
            id="originalUrl"
            type="text"
            class="input"
            placeholder="Cole sua URL aqui (ex: https://exemplo.com/pagina-com-url-muito-longa)"
            value={originalUrl()}
            onInput={(e) => setOriginalUrl(e.target.value)}
          />
        </div>
        
        <div class="form-group">
          <label for="customSlug" class="label">Slug Personalizado (opcional)</label>
          <input
            id="customSlug"
            type="text"
            class="input"
            placeholder="seu-slug-personalizado"
            value={customSlug()}
            onInput={(e) => setCustomSlug(e.target.value)}
          />
          <p class="input-description">Personalize o final da sua URL encurtada</p>
        </div>
        
        <button 
          class={`button ${isLoading() ? 'loading' : ''}`}
          onClick={shortenUrl}
          disabled={isLoading() || !originalUrl()}
        >
          <Show when={isLoading()} fallback="Encurtar URL">
            <span class="spinner"></span>
            <span>Encurtando...</span>
          </Show>
        </button>
        
        <Show when={error()}>
          <div class="alert alert-error">
            <span class="alert-icon">⚠️</span>
            <span>{error()}</span>
          </div>
        </Show>
        
        <Show when={shortUrl()}>
          <div class="result-box">
            <div class="result-header">
              <span>URL encurtada:</span>
              <button class="copy-button" onClick={copyToClipboard}>
                {copied() ? "Copiado! ✓" : "Copiar"}
              </button>
            </div>
            <a 
              href={shortUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              class="short-url"
            >
              {shortUrl()}
            </a>
          </div>
        </Show>

        <div class="footer">
          <p>© 2025 Lima, Edivan • Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}