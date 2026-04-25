import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// SHA-256 hex (mismo algoritmo que AuthContext.hashPassword)
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Genera contraseña temporal: 12 chars con mayúscula, minúscula, número, especial
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*?'
  const all = upper + lower + digits + special

  const rand = (s: string) => s[Math.floor(Math.random() * s.length)]

  const required = [rand(upper), rand(lower), rand(digits), rand(special)]
  const remaining = Array.from({ length: 8 }, () => rand(all))
  const arr = [...required, ...remaining]

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let identifier: string
  try {
    const body = await req.json()
    identifier = String(body?.identifier ?? '').trim()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!identifier || identifier.length < 4 || identifier.length > 100) {
    return jsonResponse({ error: 'Identificador inválido' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Detectar si es cédula (sólo dígitos) o correo
  const isNumeric = /^\d+$/.test(identifier)

  // Buscar usuario
  const query = supabase
    .from('users')
    .select('id, cc, email, first_name, last_name')
    .limit(1)

  const { data: users, error: queryError } = isNumeric
    ? await query.eq('cc', identifier)
    : await query.eq('email', identifier.toLowerCase())

  if (queryError) {
    console.error('Error querying user', { error: queryError })
    // Mensaje neutro para no filtrar información
    return jsonResponse({ success: true })
  }

  const user = users && users.length > 0 ? users[0] : null

  if (!user || !user.email) {
    // Respuesta neutra: no se revela si la cuenta existe o no.
    console.log('Password reset requested for unknown identifier')
    return jsonResponse({ success: true })
  }

  // Generar y guardar la contraseña temporal hasheada
  const tempPassword = generateTempPassword()
  const hashed = await sha256Hex(tempPassword)

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashed })
    .eq('id', user.id)

  if (updateError) {
    console.error('Failed to update user password', { error: updateError })
    return jsonResponse({ error: 'No se pudo actualizar la contraseña' }, 500)
  }

  // Enviar correo transaccional
  try {
    const { error: emailError } = await supabase.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'password-reset-temporary',
          recipientEmail: user.email,
          idempotencyKey: `pwd-reset-${user.id}-${Date.now()}`,
          templateData: {
            name:
              [user.first_name, user.last_name].filter(Boolean).join(' ') ||
              undefined,
            tempPassword,
          },
        },
      }
    )

    if (emailError) {
      console.error('Failed to enqueue password reset email', {
        error: emailError,
      })
      // La contraseña ya se actualizó; informar para que el usuario reintente.
      return jsonResponse(
        { error: 'No se pudo enviar el correo. Intenta nuevamente.' },
        500
      )
    }
  } catch (err) {
    console.error('Unexpected error sending email', { err })
    return jsonResponse(
      { error: 'No se pudo enviar el correo. Intenta nuevamente.' },
      500
    )
  }

  return jsonResponse({ success: true })
})
