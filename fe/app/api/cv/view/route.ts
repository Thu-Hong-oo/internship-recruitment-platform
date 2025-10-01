import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('CV Proxy: Request received')
    
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
      console.log('CV Proxy: No token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('CV Proxy: Token present, forwarding to backend')

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const fullUrl = `${backendUrl}/api/candidates/me/cv/view`
    
    console.log('CV Proxy: Fetching from', fullUrl)
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log('CV Proxy: Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('CV Proxy: Backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch CV', details: errorText }, 
        { status: response.status }
      )
    }

    // Get the PDF data
    const pdfBuffer = await response.arrayBuffer()
    console.log('CV Proxy: PDF buffer size:', pdfBuffer.byteLength)
    
    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="cv.pdf"',
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('CV Proxy: Error occurred:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}