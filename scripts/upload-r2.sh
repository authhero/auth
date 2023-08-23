export NO_D1_WARNING=true
cd src
find templates -name "*.*" | while read fname; do
    npx wrangler r2 object put auth-templates/$fname -f $fname
done