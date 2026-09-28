import { defineConfig } from 'vite';

// base './' gør at det byggede site virker fra enhver undermappe
// (fx https://brugernavn.github.io/kinematik/) uden ekstra opsætning.
export default defineConfig({
  base: './',
  server: { port: 5178 },
  test: { include: ['tests/**/*.test.ts'] },
} as never);
