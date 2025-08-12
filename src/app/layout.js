// src/app/layout.js

import { Inter, Poppins, Roboto_Mono } from 'next/font/google';
import './(dashboard)/globals.css'; // Note que aqui é './globals.css', não '../styles/globals.css'

// Configuração das fontes com pesos e subsets
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter-local',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins-local',
  display: 'swap',
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono-local',
  display: 'swap',
});

export const metadata = {
  title: 'Sistema de Gestão de Férias',
  description: 'Plataforma para distribuição e gestão automatizada de férias.',
};

// AQUI ESTÁ A CORREÇÃO PRINCIPAL: AS TAGS HTML E BODY
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable} ${roboto_mono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}