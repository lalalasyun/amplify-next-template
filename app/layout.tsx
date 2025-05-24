'use client'

import outputs from '@/amplify_outputs.json'
import { Amplify } from 'aws-amplify'
import React from 'react'
import './globals.css'

if (process.env.NEXT_PUBLIC_AUTH_CUSTOM_DOMAIN) {
  outputs.auth.oauth.domain = process.env.NEXT_PUBLIC_AUTH_CUSTOM_DOMAIN;
}

Amplify.configure(outputs)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen">
        {children}
      </body>
    </html>
  )
}
