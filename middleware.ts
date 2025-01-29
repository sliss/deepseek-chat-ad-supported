import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.headers.get('host') === 'https://exa-deepseek-chat.vercel.app') {
    return NextResponse.redirect('https://demo.exa.ai/deepseekchat', {
      status: 301
    })
  }
  return NextResponse.next()
}
export const config = {
  matcher: '/:path*'
} 