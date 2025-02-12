import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.headers.get('host') === 'https://exa-deepseek-chat.vercel.app') {
    return NextResponse.redirect('https://freeseek.ai', {
      status: 301
    })
  }
  
  // Redirect /deepseekchat to root
  if (request.nextUrl.pathname.startsWith('/deepseekchat')) {
    return NextResponse.redirect(new URL('/', request.url), {
      status: 301
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*'
} 