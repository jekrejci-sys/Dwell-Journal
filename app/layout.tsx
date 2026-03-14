export const metadata = {
  title: 'Dwell Journal',
  description: 'Your daily Bible reading journal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
