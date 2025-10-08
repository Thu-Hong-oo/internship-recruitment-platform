import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cvIndex: string }> }
) {
  try {
    const { cvIndex } = await params;
    console.log('History CV Proxy: Request received for index', cvIndex)
    
    // Get token from query parameter or authorization header
    const { searchParams } = new URL(request.url)
    const tokenFromQuery = searchParams.get('token')
    const authHeader = request.headers.get('authorization')
    
    let token = ''
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (tokenFromQuery) {
      token = tokenFromQuery
    }
    
    if (!token) {
      console.log('History CV Proxy: No token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('History CV Proxy: Token present, forwarding to backend')

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const fullUrl = `${backendUrl}/api/candidates/me/cv/view/${cvIndex}`
    
    console.log('History CV Proxy: Fetching from', fullUrl)

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('History CV Proxy: Backend response status', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('History CV Proxy: Backend error', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch CV from backend' },
        { status: response.status }
      )
    }

    // Get the content type from backend response
    const contentType = response.headers.get('content-type') || 'application/pdf'
    const contentDisposition = response.headers.get('content-disposition') || 'inline; filename="resume.pdf"'
    
    console.log('History CV Proxy: Content type', contentType)
    console.log('History CV Proxy: Content disposition', contentDisposition)

    // Stream the response
    const arrayBuffer = await response.arrayBuffer()
    
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', contentType)
    responseHeaders.set('Content-Disposition', contentDisposition)
    responseHeaders.set('Cache-Control', 'public, max-age=3600')
    responseHeaders.set('X-Content-Type-Options', 'nosniff')
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN')

    console.log('History CV Proxy: Returning CV content')
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('History CV Proxy: Error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}