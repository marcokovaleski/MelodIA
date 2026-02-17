# MelodIA — Frontend React

Frontend moderno e responsivo do **MelodIA**, convertido do protótipo HTML/CSS para **React + Vite**, com Tailwind CSS, arquitetura escalável e componentes reutilizáveis.

## Estrutura do projeto

```
src/
  components/     # Componentes reutilizáveis
  pages/          # Páginas da aplicação
  hooks/          # Hooks customizados
  context/        # Context API (Auth)
  services/       # Serviços (Spotify OAuth, N8N, API)
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
| `/criar-playlist`  | Gerar playlist         | Busca + player + lista       |
| `/biblioteca`      | Biblioteca             | Playlists (grid + abas)      |
| `/configuracoes`   | Configurações          | Placeholder                  |
| `/playlist/:id`    | Detalhe da playlist    | Reutiliza GeneratePlaylist   |

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Build de produção:

```bash
npm run build
npm run preview
```

## Integrações futuras (preparadas)

- **Spotify OAuth**: estrutura em `src/services/spotifyAuth.js` (URL de auth, troca de code, refresh). Implementar no backend e chamar a partir do front.
- **N8N**: `src/services/n8n.js` com `callN8nWorkflow` e `generatePlaylistViaN8n` (stub). Definir `VITE_N8N_BASE_URL` no `.env` quando o workflow estiver pronto.
- **API genérica**: `src/services/api.js` com `api.get/post/put/delete`. Definir `VITE_API_BASE_URL` no `.env` se houver backend.

## Variáveis de ambiente (opcional)

Crie `.env` na raiz:

```env
VITE_API_BASE_URL=https://sua-api.com
VITE_N8N_BASE_URL=https://seu-n8n.com
```

## Tecnologias

- React 19
- Vite 7
- React Router 6
- Tailwind CSS v4
- Manrope + Noto Sans (Google Fonts)
- Material Symbols Outlined (ícones)

## Acessibilidade

- Uso de labels associados a inputs onde aplicável.
- Atributos ARIA em botões de ícone (`aria-label`), navegação e seções.
- Foco visível com `focus-visible:ring` nos controles.
- Estrutura semântica (header, main, footer, nav, section).

---

© MelodIA — Playlists com IA.
