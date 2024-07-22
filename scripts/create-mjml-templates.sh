export NO_D1_WARNING=true
cd src

npx mjml email-templates/verify-email.mjml -o templates/email/verify-email.liquid
npx mjml email-templates/password-reset.mjml -o templates/email/password-reset.liquid
npx mjml email-templates/code-v2.mjml -o templates/email/code-v2.liquid
npx mjml email-templates/link-v2.mjml -o templates/email/link-v2.liquid
npx mjml email-templates/pre-signup-verification.mjml -o templates/email/pre-signup-verification.liquid

cd ..

node textfile2ts src/templates/email/verify-email.liquid src/templates/email/ts/verify-email.ts verifyEmail
node textfile2ts src/templates/email/password-reset.liquid src/templates/email/ts/password-reset.ts passwordReset
node textfile2ts src/templates/email/code-v2.liquid src/templates/email/ts/code-v2.ts codeV2
node textfile2ts src/templates/email/pre-signup-verification.liquid src/templates/email/ts/pre-signup-verification.ts preSignupVerification

yarn format # could be more targeted and just do liquid ts files