import './globals.css';

export const metadata = {
  title: 'Whist Game - Score Tracker',
  description: 'Aplicație pentru tracking-ul scorului la jocul de Whist adaptat. Gestionează jucători, echipe, pariuri și scor.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>
        {children}
      </body>
    </html>
  );
}
