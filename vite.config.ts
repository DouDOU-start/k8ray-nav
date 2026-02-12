import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // WSL2 访问 /mnt/ 挂载盘时 inotify 不生效，需要轮询
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
