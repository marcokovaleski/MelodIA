import { Button } from '../components';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-primary)] md:text-4xl">
        Configurações
      </h1>
      <p className="text-[var(--color-text-subtle)]">
        Preferências e integrações (Spotify, tema, etc.) serão configuráveis aqui.
      </p>
      <Button variant="outline" disabled>
        Em breve
      </Button>
    </div>
  );
}
