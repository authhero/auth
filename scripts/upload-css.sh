# ideally we would not do this but for now... let's do this!
npx wrangler r2 object put auth-templates/templates/static/stylesheets/tailwind.css -f src/styles/output.css
# note inconsistent naming! is served from /css/default.css, is uploaded to tailwind.css, is built as output.css
# Call it one name everywhere!