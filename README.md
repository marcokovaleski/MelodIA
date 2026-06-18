# MelodIA — Frontend React

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-Workflows-FF6D5A?logo=n8n&logoColor=white)

Frontend moderno e responsivo do **MelodIA**, convertido do protótipo HTML/CSS para **React + Vite**, com Tailwind CSS, arquitetura escalável e componentes reutilizáveis. Os workflows de IA (geração e edição de playlists) são orquestrados pelo **n8n**.

## Estrutura do projeto

```
src/
  components/     # Componentes reutilizáveis
  pages/          # Páginas da aplicação
  hooks/          # Hooks customizados
  context/        # Context API (Auth, Player)
  services/       # Serviços (Spotify OAuth, n8n, API)
  assets/         # Imagens e estáticos
  styles/         # (tokens no index.css)
```

## Componentes principais

| Componente     | Descrição                          |
|----------------|------------------------------------|
| `Navbar`       | Cabeçalho com logo e avatar        |
| `Sidebar`      | Menu lateral (Início, Biblioteca…) |
| `Footer`       | Rodapé                             |
| `Hero`         | Seção principal da home com input   |
| `Button`       | Botão (variantes e tamanhos)        |
| `Input`        | Campo de texto com label/hint      |
| `MusicCard`    | Item de música em listas           |
| `PlaylistCard` | Card de playlist na grade           |
| `PromptCard`   | Card de prompt (Explore)           |
| `Tabs`         | Abas (ex.: Biblioteca)             |
| `Layout`       | Layout com navbar + footer         |
| `LayoutWithSidebar` | Layout com sidebar              |

## Páginas e rotas

| Rota               | Página                | Descrição                    |
|--------------------|------------------------|------------------------------|
| `/`                | Home                   | Hero + input para prompt     |
| `/login`           | Login                  | Login com Spotify            |
| `/explore`         | Explore                | Prompts, artistas, músicas   |
| `/` (Hero)         | Gerar playlist         | Prompt + webhook n8n         |
| `/biblioteca`      | Biblioteca             | Playlists (grid + abas)      |
| `/configuracoes`   | Configurações          | Placeholder                  |
| `/playlist/:id`    | Detalhe da playlist    | Spotify API                  |

---

## 📋 Requisitos Prévios

- **Docker** e **Docker Compose** instalados.
- **Node.js** e **NPM** (necessários para rodar o tunelamento local e o frontend).

---

## 🚀 Configuração do n8n Local com Docker e Tunelamento

O **n8n** gerencia os workflows do projeto (geração e edição de playlists com IA). Como o Spotify exige **HTTPS** e não aceita callbacks tradicionais de `localhost` por segurança, usamos o [Localtunnel](https://github.com/localtunnel/localtunnel) para expor o ambiente local de forma segura.

### 1. Iniciar o Túnel

```bash
npm install -g localtunnel
lt --port 5678 --local-host localhost --subdomain melodiau
```

> **Nota:** O subdomínio `melodiau` fixa a URL pública em `https://melodiau.loca.lt`. Mantenha o processo do túnel em execução enquanto desenvolve.

### 2. Configurar o Docker Compose

Mantenha o arquivo `docker-compose.yml` na raiz do projeto:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n_app
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=melodiau.loca.lt
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://melodiau.loca.lt/
      - NODE_ENV=production
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
    volumes:
      - ./n8n_data:/home/node/.n8n
```

### 3. Subir o Container

```bash
docker compose up -d
```

> **Atenção:** Inicie o túnel **antes** de subir o container, para que o n8n registre a URL pública correta nos webhooks.

---

## 🔄 Importando os Workflows do n8n

Na raiz do repositório existem dois arquivos JSON com os fluxos (webhooks) prontos:

| Arquivo             | Workflow              | Webhook esperado              |
|---------------------|-----------------------|-------------------------------|
| `webhook.json`      | Geração de playlist   | `/webhook/melodia`            |
| `webhook edit.json` | Edição de playlist    | `/webhook/melodia-edit`       |

**Passos:**

1. Acesse o painel do n8n em [`https://melodiau.loca.lt`](https://melodiau.loca.lt).
2. Crie um novo workflow e use **Import from File** (Import de arquivo JSON) para carregar cada um dos arquivos acima.
3. Ative os workflows (toggle **Active** no canto superior direito).
4. Copie as URLs dos webhooks gerados no nó **Webhook** de cada fluxo.
5. Confirme que a URL base coincide com `VITE_N8N_BASE_URL` no seu arquivo `.env` (copie de `.env.example`):

```env
VITE_N8N_BASE_URL=https://melodiau.loca.lt
```

> **Dica (dev):** Para evitar problemas de CORS em desenvolvimento, defina também `VITE_WEBHOOK_PROXY_TARGET=https://melodiau.loca.lt` — o Vite redireciona `/webhook/*` para o túnel automaticamente.

---

## 🔑 Guia de Obtenção de Credenciais

### Spotify Developer Dashboard

1. Crie um app no [Spotify Developer Portal](https://developer.spotify.com/dashboard).
2. Configure a **Redirect URI** obrigatória apontando para o n8n tunelado:

   ```
   https://melodiau.loca.lt/rest/oauth2-credential/callback
   ```

3. Colete o **Client ID** e **Client Secret** para cadastrar na aba **Credentials** do n8n (credencial OAuth2 do Spotify).
4. Copie o **Client ID** também para o `.env` do frontend:

   ```env
   VITE_SPOTIFY_CLIENT_ID=seu_client_id_aqui
   ```

### Google Gemini API (Google AI Studio)

1. Acesse o [Google AI Studio](https://aistudio.google.com/) e gere uma **API Key**.
2. > **Nota de Segurança:** Para maior segurança e isolamento de escopo, esta chave do Gemini deve ser configurada **diretamente dentro do nó do Gemini no n8n**, e **não** no `.env` do app.

---

## Como rodar o frontend

```bash
cp .env.example .env   # edite com suas credenciais
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Build de produção:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Crie `.env` na raiz a partir de `.env.example`:

```env
# Spotify
VITE_SPOTIFY_CLIENT_ID=your_client_id_here

# n8n (URL pública via Localtunnel)
VITE_N8N_BASE_URL=https://melodiau.loca.lt

# Dev: proxy de webhooks para evitar CORS (opcional)
# VITE_WEBHOOK_PROXY_TARGET=https://melodiau.loca.lt
```

Consulte `.env.example` para a lista completa e comentários de cada variável.

## Integrações

| Serviço   | Arquivo                  | Descrição                                      |
|-----------|--------------------------|------------------------------------------------|
| Spotify   | `src/auth/spotifyPKCE.js` | OAuth PKCE, tokens e chamadas à Web API       |
| n8n       | `src/services/n8n.js`    | Geração (`/webhook/melodia`) e edição de playlists |
| API       | `src/services/api.js`    | Cliente HTTP genérico (`VITE_API_BASE_URL`)   |

## Tecnologias

- React 19
- Vite 7
- React Router 6
- Tailwind CSS v4
- Manrope + Noto Sans (Google Fonts)
- Material Symbols Outlined (ícones)
- n8n (workflows de IA)
- Localtunnel (exposição HTTPS em dev)

## Acessibilidade

- Uso de labels associados a inputs onde aplicável.
- Atributos ARIA em botões de ícone (`aria-label`), navegação e seções.
- Foco visível com `focus-visible:ring` nos controles.
- Estrutura semântica (header, main, footer, nav, section).

---

© MelodIA — Playlists com IA.
