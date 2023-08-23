export NO_D1_WARNING=true
cd src
# TODO - run script here to generate the latest MJML templates
find email-templates -name "*.*" | while read fname; do
    wrangler r2 object put email-templates/$fname -f $fname
done