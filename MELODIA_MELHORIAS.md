# Sugestões de melhoria — MelodIA (próxima versão)

## Visual e UI/UX

1. **Tema escuro**
   - Implementar toggle no Navbar/Sidebar e persistir em `localStorage` (ex.: hook `useLocalStorage`).
   - Aplicar classes `dark:` do Tailwind de forma consistente em todos os componentes.

2. **Micro-interações**
   - Transições suaves ao trocar de rota (ex.: React Transition Group ou Framer Motion).
   - Skeleton loaders na Biblioteca e na página de playlist enquanto “carrega”.
   - Feedback visual ao enviar o prompt (loading no botão, mensagem “Gerando playlist…”).

3. **Empty states**
   - Na Biblioteca, quando não houver playlists: ilustração + texto “Você ainda não criou nenhuma playlist” + CTA “Criar primeira playlist” (já comentado no HTML original).

4. **Consistência de cores**
   - Unificar tons de verde (hoje há #05b38d, #049b7a, #00B894). Escolher uma cor primária e derivar hover/light no `@theme` do Tailwind.

5. **Responsividade**
   - Sidebar colapsável em mobile (drawer ou ícone de menu que abre overlay).
   - Grid da Biblioteca com menos colunas em telas pequenas (já em auto-fill; revisar `minmax` se necessário).

## Estrutural e código

6. **Rotas protegidas**
   - Se login for obrigatório para Biblioteca/Criar Playlist: componente `ProtectedRoute` que redireciona para `/login` quando `!user`.

7. **Estado global**
   - Além de `AuthContext`, considerar Context ou store (ex.: Zustand) para “playlist atual”, “faixa tocando”, “lista de playlists” quando integrar API.

8. **Tratamento de erros**
   - Boundaries de erro por rota ou por seção.
   - Toasts ou mensagens inline para erros de API/N8N (ex.: “Não foi possível gerar a playlist”).

9. **Testes**
   - Testes unitários para serviços (`spotifyAuth`, `n8n`, `api`) com mocks.
   - Testes de componentes críticos (Hero, PlaylistCard, formulários) com React Testing Library.

10. **SEO e meta**
    - Títulos e descrições por rota (React Helmet ou similar).
    - Favicon e Open Graph para compartilhamento.

## Funcional (quando integrar backend)

11. **Spotify**
    - Fluxo completo: redirect → callback com `code` → backend troca por token → salvar refresh token e usar no front (ou só no backend).
    - Escopos: `playlist-modify-public`, `playlist-read-private`, `user-read-email`, etc.

12. **N8N**
    - Webhook/API para “gerar playlist” recebendo prompt e (futuro) token do usuário.
    - Retorno: lista de faixas ou ID da playlist no Spotify; atualizar UI com os dados reais.

13. **Biblioteca**
    - Listar playlists reais do usuário (Spotify + playlists geradas pela IA salvas em backend).
    - Abas Artistas/Álbuns/Podcasts com dados reais quando houver endpoints.

14. **Player**
    - Integrar Spotify Web Playback SDK ou Embed para reprodução real na página “Gerar playlist” / detalhe da playlist.

---

Estas sugestões podem ser priorizadas em sprints (ex.: 1–5 primeiro, 6–10 em seguida, 11–14 na fase de integração).
