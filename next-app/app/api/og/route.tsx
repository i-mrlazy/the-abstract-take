import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'The Abstract Take';
    const score = searchParams.get('score') || '10';
    const year = searchParams.get('year') || '2025';
    const type = searchParams.get('type') || 'Cinema Review';
    const director = searchParams.get('director') || '';
    const descriptor = searchParams.get('descriptor') || 'Masterpiece';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#FAF9F6',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #e5e7eb 2%, transparent 0%)',
            backgroundSize: '40px 40px',
            padding: '60px',
            fontFamily: 'sans-serif',
            border: '16px solid #111111',
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: '#008CFF',
                  color: '#FFFFFF',
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  marginRight: '18px',
                  border: '3px solid #111111',
                }}
              >
                AT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    color: '#111111',
                  }}
                >
                  THE ABSTRACT TAKE
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    color: '#008CFF',
                    textTransform: 'uppercase',
                  }}
                >
                  Independent Cinema Critique
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #111111',
                borderRadius: '12px',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 800,
                color: '#111111',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
            >
              {type}
            </div>
          </div>

          {/* Center Title and Details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              margin: '30px 0',
            }}
          >
            <div
              style={{
                fontSize: title.length > 30 ? '48px' : '64px',
                fontWeight: 900,
                color: '#111111',
                lineHeight: 1.1,
                marginBottom: '16px',
                maxWidth: '900px',
              }}
            >
              {title}
            </div>

            {director ? (
              <div
                style={{
                  fontSize: '22px',
                  color: '#4B5563',
                  fontWeight: 600,
                }}
              >
                Directed by {director} • {year}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '22px',
                  color: '#4B5563',
                  fontWeight: 600,
                }}
              >
                Release Year: {year}
              </div>
            )}
          </div>

          {/* Bottom Card Footer with Abstract Score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '3px solid #111111',
              paddingTop: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  border: '3px solid #008CFF',
                  boxShadow: '4px 4px 0px #008CFF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', marginRight: '14px' }}>
                  <span style={{ fontSize: '38px', fontWeight: 900, color: '#008CFF' }}>
                    {score}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#9CA3AF' }}>
                    /10
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {descriptor}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#6B7280',
                letterSpacing: '0.5px',
              }}
            >
              theabstracttake.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    return new Response(`Failed to generate OG image: ${err.message}`, { status: 500 });
  }
}
