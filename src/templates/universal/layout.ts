export const layout = `<!DOCTYPE html>
<html lang="en">

<head>
  <title>{{page_title}}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <meta name="robots" content="noindex, follow">

  <link rel="stylesheet" type="text/css" href="/static/stylesheets/font-awesome.min.css">
  <link rel="stylesheet" type="text/css" href="/static/stylesheets/material-design-iconic-font.min.css">

  <link rel="stylesheet" type="text/css" href="/static/stylesheets/main.css">
  <link rel="stylesheet" type="text/css" href="/static/stylesheets/util.css">
</head>

<body>
  <div class="container-login100" style="background-image: url('/static/images/bg-01.webp');">
    {{content}}
  </div>
</body>

</html>`;
