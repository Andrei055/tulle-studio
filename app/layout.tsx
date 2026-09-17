import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Tulle Studio — конструктор конвертов",
  description:
    "Параметрический редактор декоративных конвертов из PLA и ткани. 2D, 3D и экспорт в миллиметрах.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
