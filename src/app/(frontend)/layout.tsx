import React from 'react'
import './styles.css'

export const metadata = {
  description:
    'Find sourced, human-reviewed Mongolian translations for modern English terminology.',
  title: 'OpenToli | English-to-Mongolian terminology',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
