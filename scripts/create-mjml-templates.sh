export NO_D1_WARNING=true
cd src

# hardcode just the swedish code email for now
npx mjml email-templates/code.mjml -o templates/email/code.liquid

# also upload to wrangler in this script for now so we can quickly upload new email templates
npx wrangler r2 object put auth-templates/templates/email/code.liquid -f templates/email/code.liquid
