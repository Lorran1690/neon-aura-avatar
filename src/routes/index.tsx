import { createFileRoute } from "@tanstack/react-router";
import { AvatarStudio } from '@/components/AvatarStudio';
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: 'AURA — Estúdio de Avatar Holográfico' },
    { name: 'description', content: 'Avatar holográfico 3D interativo com animações naturais, gestos, emoções e interface de eventos para IA.' },
    { property: 'og:title', content: 'AURA — Estúdio de Avatar Holográfico' },
    { property: 'og:description', content: 'Explore seu avatar neon em 3D. Calibre animações, emoções e estados de inteligência artificial.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: AvatarStudio,
});
