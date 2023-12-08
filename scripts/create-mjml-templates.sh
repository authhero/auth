export NO_D1_WARNING=true
cd src

npx mjml email-templates/code.mjml -o templates/email/code.liquid
npx mjml email-templates/link.mjml -o templates/email/link.liquid
npx mjml email-templates/verify-email.mjml -o templates/email/verify-email.liquid
npx mjml email-templates/password-reset.mjml -o templates/email/password-reset.liquid
npx mjml email-templates/code-v2.mjml -o templates/email/code-v2.liquid
npx mjml email-templates/link-v2.mjml -o templates/email/link-v2.liquid

# also upload to wrangler in this script for now so we can quickly upload new email templates
npx wrangler r2 object put auth-templates/templates/email/code.liquid -f templates/email/code.liquid
npx wrangler r2 object put auth-templates/templates/email/link.liquid -f templates/email/link.liquid
npx wrangler r2 object put auth-templates/templates/email/verify-email.liquid -f templates/email/verify-email.liquid
npx wrangler r2 object put auth-templates/templates/email/password-reset.liquid -f templates/email/password-reset.liquid
npx wrangler r2 object put auth-templates/templates/email/code-v2.liquid -f templates/email/code-v2.liquid
npx wrangler r2 object put auth-templates/templates/email/link-v2.liquid -f templates/email/link-v2.liquid