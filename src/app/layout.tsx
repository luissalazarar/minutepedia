import "./globals.css";

export const metadata = {
  title: "MinutePedia",
  description: "Generador automático de videos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
