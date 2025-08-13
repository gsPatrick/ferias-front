// src/app/layout.js

// Importe suas fontes e o CSS global aqui
import '../app/(dashboard)/globals.css';
// Se você estiver usando next/font para Poppins, Inter, etc., elas devem ser importadas aqui.
// Exemplo: import { Inter, Poppins } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'], variable: '--font-inter-local' });
// const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins-local' });

export const metadata = {
  title: 'Sistema de Gestão de Férias',
  description: 'Gerencie as férias dos seus colaboradores de forma eficiente.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      {/* A classe aqui aplicaria as fontes importadas */}
      <body /*className={`${inter.variable} ${poppins.variable}`}*/>
        {children}
      </body>
    </html>
  );
}