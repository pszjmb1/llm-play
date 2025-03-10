const toml = require('@iarna/toml')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const path = require('path')

const generateEnv = () => {
  try {
    const configPath = path.join(process.cwd(), 'supabase/config.toml')
    const configFile = readFileSync(configPath, 'utf-8')
    const config = toml.parse(configFile)
    
    // Read existing .env.local if it exists
    let envContent = ''
    if (existsSync('.env.local')) {
      const existingEnv = readFileSync('.env.local', 'utf-8')
      // Remove any existing MIN_PASSWORD_LENGTH line
      envContent = existingEnv
        .split('\n')
        .filter((line: string) => !line.startsWith('NEXT_PUBLIC_MIN_PASSWORD_LENGTH='))
        .join('\n')
      if (!envContent.endsWith('\n')) {
        envContent += '\n'
      }
    }

    // Add the new MIN_PASSWORD_LENGTH
    envContent += `NEXT_PUBLIC_MIN_PASSWORD_LENGTH=${config.auth.minimum_password_length}\n`

    writeFileSync('.env.local', envContent)
    console.log('Environment variables generated successfully')
  } catch (error) {
    console.error('Error generating environment variables:', error)
  }
}

generateEnv()
