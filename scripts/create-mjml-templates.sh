export NO_D1_WARNING=true
cd src

# hardcode just the swedish code email for now
npx mjml email-templates/code.mjml -o templates/email/code.liquid
