# Neon Aura Avatar

Criar uma aplicação web 3D interativa com Three.js / React Three Fiber com tema de Avatar Holográfico Cyberpunk/Neon (estética translúcida roxa/neon com partículas de energia, circuitos luminosos e brilho cósmico). A aplicação deve conter:
- Um avatar humanoide 3D holográfico estilizado com materiais holográficos transparentes, fresnel/glow violeta e partículas brilhantes flutuando ao redor.
- Sistema de animações e poses interativas para integração com IA:
  - Animação contínua de respiração (idle breathing: peito/tronco expandindo suavemente)
  - Animação de piscar de olhos (blinking)
  - Movimentos suaves e naturais de cabeça (idle head tilt / look around)
  - Movimentos e gestos dos braços (ex: gesticular ao falar, saudar/acenar, repouso)
  - Modos de estado da IA (Ouvindo / Pensando / Falando / Ocioso) com feedback visual nas luzes holográficas e ondas de energia.
- Painel de controle e testes interativos para disparar e calibrar cada animação e emoção/gesto.
- Uma API / interface de eventos (WebSocket ou window postMessage / dispatchEvent / hook exposto) para que o sistema de IA externo possa disparar comandos facilmente como speak(), listen(), gesture(name), setEmotion().
- Controles de órbita 3D, controle de intensidade de brilho do holograma, scanlines e rotação.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://neon-aura-avatar.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6192856a-d18c-4601-ad51-7367a45e9c7f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
