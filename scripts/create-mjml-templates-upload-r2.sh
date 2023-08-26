export NO_D1_WARNING=true
cd src
cd email-templates
# hardcode just the swedish code email for now
npx mjml mjml/code.mjml -o output/code.liquid
npx wrangler r2 object put email-templates/code.liquid -f output/code.liquid
# how to do all templates? add a few and tr *
# TODO - work out a solution here because I"m pulling the full filename with 'find'
# find mjml -name "*.*" | while read fname; do
#     npx mjml mjml/$fname -o output/output.liquid
#     npx wrangler r2 object put email-templates/$fname -f $fname
# done