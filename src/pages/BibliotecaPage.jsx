import { useState } from 'react';
import { Tabs, PlaylistCard } from '../components';

const LIBRARY_PLAYLISTS = [
  { id: '1', title: 'Pop Relax para Codificar', subtitle: '35 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnvqKbF0tMxatIEfinhW1HVnmP5GuTdZ3tnXJUBIN7GcnRGe5EjtdUdafHByJ2-cmm9brckxwXFO1wsvC6-mrHMOgLTAILcUXspRuvLqwgU-_IJz1t5XJqOCqmaVObttgU5KfXVI64yZBVQrg_CgDZlACPRQiTwNWW-PYSLKgDKUcZHbh-cO7qouyh0sq446kn0ievl40kQnIVJRplY_9TjzpkMD8HIrqksn36TTppnsUTBU1o05tC7Gfw0HuEVYpWNO6SNfashbdl' },
  { id: '2', title: 'Rock Clássico de Estrada', subtitle: '50 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw028wEO3QIZXYK78vVBbcJiRJObjzNnLEwBXN_4Il0HOAzS7DWeC4QYgQegwhXmbMOKHswje8Gm2mHJ6OE12TNZme_RJr6fCcJ1wqiOGNeI92RASOF_DeGmfmgHsqbmyXTJKCij3paG7g3td-_TIZ0LlZBwaKyetKC8TdoImxEk1b_uNPlpxlTUrYdMoJGB1UZ2rJ-QL_7z-zAZZB8CYdf0HT1Ab1kzl4TcQuaKeMKpRubtK7cUiUvphXYP5rER8m62e4wBAsBLKu' },
  { id: '3', title: 'Indie para Dias Chuvosos', subtitle: '42 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMnLt3VmIPdm_lAV6YPnPRCTmI7tUkTlz8AG6VJeNaV1ZlNrSqwcoBkHEBALEZyIghYJhKq_9OQRIZeoNBU38Vyai6pD_MY3V5c8uCCt5mnxcWfgpJFEINIGCZhtKqfK173nwnAf3azPlykT9Z4h9nUVnc7j_IEjxzV4-r_UH_2iD2QhQB4cqu1RVRQXaSV840metPUV3mjdypLGXLaQf8vxNHZzYnOj-Sbs2UuDIvYjRkwshqvX4w9jDvF2NeHC-SxtCot-ziy9--' },
  { id: '4', title: 'Eletrônica para Foco', subtitle: '60 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0WMt0fh0lDK1bJ7_6HRU6FeHZoDQhryOEc5PJCM8Afo50LGxoH2DoQJLlZLWaw2FwHfjUITCOGLlfqgXctgUxtu2iMwx9g6XUieAoaL2ipm6mdVR5BiGDtWtIAOGFhl1NKD52EIZrXcWsD7R0fu1DMDd_bcTAW-pS-Ip4K4aasxrz3ujshQUtFdzsDfsdo2CSwjaHAYa7n1yZx5LAWfKfjA9eP9oZ_dM-7023UI2XVIdjGLMOJRG_3D3quM5mggnrzdIzdD6FfK7m' },
  { id: '5', title: 'Jazz Noturno', subtitle: '28 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVqzJNrU0_HTctyrSF2ZgR70HO65W9GOi9yubfGfbEsb9ssNyj3p1F7ldZjSELzWaoeHZ8hVre6lCOzWZ5jKxT6PQzV-v_3x58wX19tcMiNTSoTERc7NQWk0xImWwJxv_l4bSypJJOOFkf4tXwiI2yb3JLhTAU8NE0WIyT6MHBrS26XU8lp_Xw1-c5oFPaNqApLk9iMO2ECbNOluC3jDWUX8d39X2jRbs1p6whQWdm7E4j4FF6ujHmWhNNe6JLutsXDNwtza45abMJ' },
  { id: '6', title: 'Hip-Hop Anos 90', subtitle: '45 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT_TeDjQRmy24JgMe2KiUl7hxgIqIN6vKAMcdFgaCt3fxuYwTjUgkviIizbRL_C1NXpobTdLaJo4CAXBW2UjPsZWMSnPukRwoWPEhn63PeEg3mQf0IEV757T1gj56f9rx6HN0pLsnvraeKKo53SUFHFhRnVlycdzAd6Gu4t-DYUU_yoBQTnxUTq2cS0YXBj9gwAaljTiWSQ2G-8dIaP4VnhvOkOhHR_hhpOA0JhBw0XJ4lsVmCyaf8vTQYEHFDHPF_x1OKmJBzZVa8' },
  { id: '7', title: 'Acústico para Relaxar', subtitle: '30 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWsuvCOXJU0D7Pk8VxwnmgiUIwfsaLZFQRlNIAz9JV0uJXH_3ESZ7Hs5xB5a2DURDs9hTl48URudRhgtaSdhvNFvkE1iT1UGhgGnRzumJIKvT2e0I_g1HIuAobEv7zCV7C1mMY_qfL9IC5yg5kbSGsw0Uf-M19n5n094QlsjJV31BXnOxq2bUaywyLkS0R09C2_4XOwjpg9R6vXjfkdY-Q97-mNsOGzTNRs5QGV4v14ezJ89r1tXlNPcq49V6OJ7y6qcdWsxdz_Xz_' },
  { id: '8', title: 'Hits de Verão', subtitle: '55 músicas', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbB1cNKFOy_WwyFKcftKTAVK8hMapP2y_azr_52F8MjwoQnSMdVXOSzzAH1UiOZUp0kOPD4KHOWnnRnwEnMKYssVyVXKBpNry0yl7kkV_g7LJrgvis8DzfGgqLtBwkxhhoxoZxuLMLnvLep9AVO8URxsgHTd1titvYwUPy3bKBhd2erEl7fvhbkYN532VwnJuftWO5sGY1dfkX57Nqdg0SvSIS9rDYVl2sc1toEKhELbGfbBoAOTEpidJUHuE09YSG7PXm_O8D5VCx' },
];

const TAB_ITEMS = [
  { to: '', label: 'Playlists' },
  { to: 'artistas', label: 'Artistas' },
  { to: 'albums', label: 'Álbuns' },
  { to: 'podcasts', label: 'Podcasts e Shows' },
];

export default function BibliotecaPage() {
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black leading-tight tracking-tighter text-[var(--color-text-primary)] md:text-4xl">
            Sua Biblioteca
          </h1>
          <p className="text-base font-normal leading-normal text-[var(--color-text-subtle)]">
            Todas as suas playlists geradas pela IA em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] p-1 dark:bg-[var(--color-surface-dark)]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${viewMode === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Visualização em grade"
            aria-pressed={viewMode === 'grid'}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${viewMode === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Visualização em lista"
            aria-pressed={viewMode === 'list'}
          >
            <span className="material-symbols-outlined">list</span>
          </button>
        </div>
      </header>

      <Tabs items={TAB_ITEMS} basePath="/biblioteca" />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
        {LIBRARY_PLAYLISTS.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            id={playlist.id}
            title={playlist.title}
            subtitle={playlist.subtitle}
            coverUrl={playlist.coverUrl}
            to={`/playlist/${playlist.id}`}
          />
        ))}
      </div>
    </div>
  );
}
