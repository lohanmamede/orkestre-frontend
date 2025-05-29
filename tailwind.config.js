// Este é o arquivo de configuração do Tailwind CSS
// Ele define onde o Tailwind deve procurar por classes CSS e como o tema deve ser configurado
// Certifique-se de que o Tailwind CSS esteja instalado no seu projeto antes de usar este arquivo
// Instale o Tailwind CSS com o comando: npm install tailwindcss
// Ou, se estiver usando Yarn: yarn add tailwindcss
// Para iniciar o Tailwind CSS, você pode usar: npx tailwindcss init -p
// Ou, se estiver usando Yarn: yarn tailwindcss init
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Procura em todos os arquivos .js, .jsx, .ts, .tsx dentro da pasta src e suas subpastas
    "./public/index.html"        // Se você quiser usar classes do Tailwind no seu HTML principal
  ],
  theme: {
    extend: {}, // Aqui você poderá customizar o tema do Tailwind no futuro (cores, fontes, etc.)
  },
  plugins: [], // Para adicionar plugins do Tailwind no futuro
}