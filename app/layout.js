export const metadata = {
  title: 'Roast Room — Tokto & CupomClic',
  description: 'Conselho Consultivo Virtual com IA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#070d17] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
