cd ui
yarn build
find build -name "*.*" | while read fname; do
    wrangler r2 object put auth-templates/$fname -f $fname
done