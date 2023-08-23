export NO_D1_WARNING=true
cd src
cd email-templates
# how to do all templates? add a few and tr *
npx mjml mjml/input.mjml -o output/output.html
find output -name "*.*" | while read fname; do
    npx wrangler r2 object put email-templates/$fname -f $fname
done