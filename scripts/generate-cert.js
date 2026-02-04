import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const certsDir = path.resolve(__dirname, '../certs')

// Crear directorio de certificados si no existe
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true })
}

const certPath = path.join(certsDir, 'localhost.crt')
const keyPath = path.join(certsDir, 'localhost.key')

console.log('🔐 Generando certificados SSL autofirmados...\n')

try {
  // Verificar si openssl está disponible
  execSync('openssl version', { stdio: 'ignore' })
  
  // Generar clave privada
  console.log('Generando clave privada...')
  execSync(
    `openssl genrsa -out "${keyPath}" 2048`,
    { stdio: 'inherit' }
  )
  
  // Generar certificado autofirmado válido por 365 días
  console.log('Generando certificado autofirmado...')
  execSync(
    `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1,IP:192.168.0.0/16,IP:10.0.0.0/8"`,
    { stdio: 'inherit' }
  )
  
  console.log('\n✅ Certificados generados exitosamente!')
  console.log(`   Certificado: ${certPath}`)
  console.log(`   Clave: ${keyPath}\n`)
  console.log('⚠️  Nota: Los navegadores mostrarán una advertencia de seguridad.')
  console.log('   Esto es normal para certificados autofirmados.')
  console.log('   Haz clic en "Avanzado" → "Continuar al sitio" para acceder.\n')
  
} catch (error) {
  if (error.message.includes('openssl')) {
    console.error('\n❌ Error: OpenSSL no está instalado o no está en el PATH.')
    console.error('\nPara instalar OpenSSL:')
    console.error('  Windows: Descarga desde https://slproweb.com/products/Win32OpenSSL.html')
    console.error('  O usa: choco install openssl')
    console.error('  Mac: brew install openssl')
    console.error('  Linux: sudo apt-get install openssl (Ubuntu/Debian)')
    console.error('\nAlternativa: Vite generará certificados automáticamente al iniciar el servidor.')
  } else {
    console.error('\n❌ Error al generar certificados:', error.message)
  }
  process.exit(1)
}
