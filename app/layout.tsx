'use client'

import outputs from '@/amplify_outputs.json'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { Amplify } from 'aws-amplify'
import React from 'react'
import './app.css'

Amplify.configure(outputs)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Authenticator>{children}</Authenticator>
      </body>
    </html>
  )
}
