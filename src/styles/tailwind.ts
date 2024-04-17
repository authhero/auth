export const tailwindCss = `
  @font-face {
    font-display: swap;
    font-family: "KHTeka";
    font-style: normal;
    font-weight: 400;
    src: url("https://assets.sesamy.com/fonts/khteka/WOFF2/KHTeka-Regular.woff2")
      format("woff2");
  }

  @font-face {
    font-display: swap;
    font-family: "KHTeka";
    font-style: normal;
    font-weight: 500;
    src: url("https://assets.sesamy.com/fonts/khteka/WOFF2/KHTeka-Medium.woff2")
      format("woff2");
  }

  @font-face {
    font-display: swap;
    font-family: "KHTeka";
    font-style: normal;
    font-weight: 600;
    src: url("https://assets.sesamy.com/fonts/khteka/WOFF2/KHTeka-Bold.woff2")
      format("woff2");
  }

  @font-face {
    font-family: "uicon";
    src: url("../fonts/uicon/uicon.eot?t=1696266411242");
    src:
      url("../fonts/uicon/uicon.eot?t=1696266411242#iefix")
        format("embedded-opentype"),
      url("../fonts/uicon/uicon.woff2?t=1696266411242") format("woff2"),
      url("../fonts/uicon/uicon.woff?t=1696266411242") format("woff"),
      url("../fonts/uicon/uicon.ttf?t=1696266411242") format("truetype"),
      url("../fonts/uicon/uicon.svg?t=1696266411242#uicon") format("svg");
  }

  [class^="uicon-"],
  [class*=" uicon-"] {
    font-family: "uicon" !important;
    font-size: inherit;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .uicon-apple:before {
    content: "\ea01";
  }

  .uicon-arrow-down:before {
    content: "\ea02";
  }

  .uicon-arrow-left:before {
    content: "\ea03";
  }

  .uicon-arrow-right:before {
    content: "\ea04";
  }

  .uicon-arrow-up:before {
    content: "\ea05";
  }

  .uicon-facebook:before {
    content: "\ea06";
  }

  .uicon-google:before {
    content: "\ea07";
  }

  .uicon-info-bubble:before {
    content: "\ea08";
  }

  .uicon-info:before {
    content: "\ea09";
  }

  .uicon-sesamy:before {
    content: "\ea0a";
  }

  .uicon-spinner-circle:before {
    content: "\ea0b";
  }

  .uicon-spinner-inner:before {
    content: "\ea0c";
  }

  *,
  ::before,
  ::after {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #bfbcd7;
  }

  ::before,
  ::after {
    --tw-content: "";
  }

  html,
  :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
    font-family: "KHTeka", "Helvetica Neue", HelveticaNeue, "TeX Gyre Heros",
      TeXGyreHeros, FreeSans, "Nimbus Sans L", "Liberation Sans", Arimo,
      Helvetica, sans-serif;
    font-feature-settings: normal;
    font-variation-settings: normal;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    margin: 0;
    line-height: inherit;
  }

  hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }

  abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: inherit;
    font-weight: inherit;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }

  b,
  strong {
    font-weight: bolder;
  }

  code,
  kbd,
  samp,
  pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    font-feature-settings: normal;
    font-variation-settings: normal;
    font-size: 1em;
  }

  small {
    font-size: 80%;
  }

  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }

  table {
    text-indent: 0;
    border-color: inherit;
    border-collapse: collapse;
  }

  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    font-size: 100%;
    font-weight: inherit;
    line-height: inherit;
    color: inherit;
    margin: 0;
    padding: 0;
  }

  button,
  select {
    text-transform: none;
  }

  button,
  [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
    background-color: transparent;
    background-image: none;
  }

  :-moz-focusring {
    outline: auto;
  }

  :-moz-ui-invalid {
    box-shadow: none;
  }

  progress {
    vertical-align: baseline;
  }

  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    height: auto;
  }

  [type="search"] {
    -webkit-appearance: textfield;
    outline-offset: -2px;
  }

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-file-upload-button {
    -webkit-appearance: button;
    font: inherit;
  }

  summary {
    display: list-item;
  }

  blockquote,
  dl,
  dd,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  hr,
  figure,
  p,
  pre {
    margin: 0;
  }

  fieldset {
    margin: 0;
    padding: 0;
  }

  legend {
    padding: 0;
  }

  ol,
  ul,
  menu {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  dialog {
    padding: 0;
  }

  textarea {
    resize: vertical;
  }

  input::-moz-placeholder,
  textarea::-moz-placeholder {
    opacity: 1;
    color: #4b4a58;
  }

  input::placeholder,
  textarea::placeholder {
    opacity: 1;
    color: #4b4a58;
  }

  button,
  [role="button"] {
    cursor: pointer;
  }

  :disabled {
    cursor: default;
  }

  img,
  svg,
  video,
  canvas,
  audio,
  iframe,
  embed,
  object {
    display: block;
    vertical-align: middle;
  }

  img,
  video {
    max-width: 100%;
    height: auto;
  }

  [hidden] {
    display: none;
  }

  html,
  body {
    height: 100%;
  }

  body {
    --tw-bg-opacity: 1;
    background-color: rgb(248 249 251 / var(--tw-bg-opacity));
    font-size: 1rem;
    line-height: 120%;
    letter-spacing: 0.0125rem;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @media (min-width: 1280px) {
    body {
      font-size: 1.125rem;
      line-height: 120%;
    }
  }

  :is(.dark body) {
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / var(--tw-text-opacity));
  }

  button,
  input,
  optgroup,
  select,
  textarea {
    font-size: 0.875rem;
    line-height: 120%;
    letter-spacing: 0.0125rem;
  }

  @media (min-width: 1280px) {
    button,
    input,
    optgroup,
    select,
    textarea {
      font-size: 1rem;
      line-height: 120%;
    }
  }

  h1 {
    font-size: 1.5rem;
    line-height: 120%;
    font-weight: 500;
  }

  @media (min-width: 1280px) {
    h1 {
      font-size: 2rem;
      line-height: 120%;
    }
  }

  @media (min-width: 640px) {
    h1 {
      font-size: 3rem;
      line-height: 100%;
      letter-spacing: -0.0625rem;
    }
  }

  @media (min-width: 1280px) {
    h1 {
      font-size: 3.5rem;
      line-height: 100%;
      letter-spacing: -0.0625rem;
    }
  }

  h2 {
    font-size: 1.25rem;
    line-height: 120%;
    font-weight: 500;
  }

  @media (min-width: 1280px) {
    h2 {
      font-size: 1.5rem;
      line-height: 120%;
    }
  }

  @media (min-width: 640px) {
    h2 {
      font-size: 2rem;
      line-height: 120%;
      letter-spacing: 0em;
    }
  }

  @media (min-width: 1280px) {
    h2 {
      font-size: 3rem;
      line-height: 100%;
      letter-spacing: -0.0625rem;
    }
  }

  h3 {
    font-size: 1.125rem;
    line-height: 120%;
    font-weight: 500;
  }

  @media (min-width: 1280px) {
    h3 {
      font-size: 1.25rem;
      line-height: 120%;
    }
  }

  @media (min-width: 640px) {
    h3 {
      font-size: 1.5rem;
      line-height: 120%;
    }
  }

  @media (min-width: 1280px) {
    h3 {
      font-size: 2rem;
      line-height: 120%;
    }
  }

  h4 {
    font-size: 1rem;
    line-height: 120%;
    font-weight: 500;
  }

  @media (min-width: 1280px) {
    h4 {
      font-size: 1.125rem;
      line-height: 120%;
    }
  }

  @media (min-width: 640px) {
    h4 {
      font-size: 1.125rem;
      line-height: 120%;
    }
  }

  @media (min-width: 1280px) {
    h4 {
      font-size: 1.5rem;
      line-height: 120%;
    }
  }

  h5 {
    font-size: 0.875rem;
    line-height: 120%;
    font-weight: 500;
  }

  @media (min-width: 1280px) {
    h5 {
      font-size: 1rem;
      line-height: 120%;
    }
  }

  @media (min-width: 640px) {
    h5 {
      font-size: 1rem;
      line-height: 120%;
    }
  }

  @media (min-width: 1280px) {
    h5 {
      font-size: 1.125rem;
      line-height: 120%;
    }
  }

  h6 {
    font-size: 0.75rem;
    line-height: 135%;
    font-weight: 500;
  }

  @media (min-width: 1280px) {
    h6 {
      font-size: 0.875rem;
      line-height: 120%;
    }
  }

  @media (min-width: 640px) {
    h6 {
      font-size: 0.875rem;
      line-height: 120%;
    }
  }

  @media (min-width: 1280px) {
    h6 {
      font-size: 1rem;
      line-height: 120%;
    }
  }

  *,
  ::before,
  ::after {
    --tw-border-spacing-x: 0;
    --tw-border-spacing-y: 0;
    --tw-translate-x: 0;
    --tw-translate-y: 0;
    --tw-rotate: 0;
    --tw-skew-x: 0;
    --tw-skew-y: 0;
    --tw-scale-x: 1;
    --tw-scale-y: 1;
    --tw-pan-x:  ;
    --tw-pan-y:  ;
    --tw-pinch-zoom:  ;
    --tw-scroll-snap-strictness: proximity;
    --tw-gradient-from-position:  ;
    --tw-gradient-via-position:  ;
    --tw-gradient-to-position:  ;
    --tw-ordinal:  ;
    --tw-slashed-zero:  ;
    --tw-numeric-figure:  ;
    --tw-numeric-spacing:  ;
    --tw-numeric-fraction:  ;
    --tw-ring-inset:  ;
    --tw-ring-offset-width: 0px;
    --tw-ring-offset-color: #fff;
    --tw-ring-color: rgb(59 130 246 / 0.5);
    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 0 #0000;
    --tw-shadow-colored: 0 0 #0000;
    --tw-blur:  ;
    --tw-brightness:  ;
    --tw-contrast:  ;
    --tw-grayscale:  ;
    --tw-hue-rotate:  ;
    --tw-invert:  ;
    --tw-saturate:  ;
    --tw-sepia:  ;
    --tw-drop-shadow:  ;
    --tw-backdrop-blur:  ;
    --tw-backdrop-brightness:  ;
    --tw-backdrop-contrast:  ;
    --tw-backdrop-grayscale:  ;
    --tw-backdrop-hue-rotate:  ;
    --tw-backdrop-invert:  ;
    --tw-backdrop-opacity:  ;
    --tw-backdrop-saturate:  ;
    --tw-backdrop-sepia:  ;
  }

  ::backdrop {
    --tw-border-spacing-x: 0;
    --tw-border-spacing-y: 0;
    --tw-translate-x: 0;
    --tw-translate-y: 0;
    --tw-rotate: 0;
    --tw-skew-x: 0;
    --tw-skew-y: 0;
    --tw-scale-x: 1;
    --tw-scale-y: 1;
    --tw-pan-x:  ;
    --tw-pan-y:  ;
    --tw-pinch-zoom:  ;
    --tw-scroll-snap-strictness: proximity;
    --tw-gradient-from-position:  ;
    --tw-gradient-via-position:  ;
    --tw-gradient-to-position:  ;
    --tw-ordinal:  ;
    --tw-slashed-zero:  ;
    --tw-numeric-figure:  ;
    --tw-numeric-spacing:  ;
    --tw-numeric-fraction:  ;
    --tw-ring-inset:  ;
    --tw-ring-offset-width: 0px;
    --tw-ring-offset-color: #fff;
    --tw-ring-color: rgb(59 130 246 / 0.5);
    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 0 #0000;
    --tw-shadow-colored: 0 0 #0000;
    --tw-blur:  ;
    --tw-brightness:  ;
    --tw-contrast:  ;
    --tw-grayscale:  ;
    --tw-hue-rotate:  ;
    --tw-invert:  ;
    --tw-saturate:  ;
    --tw-sepia:  ;
    --tw-drop-shadow:  ;
    --tw-backdrop-blur:  ;
    --tw-backdrop-brightness:  ;
    --tw-backdrop-contrast:  ;
    --tw-backdrop-grayscale:  ;
    --tw-backdrop-hue-rotate:  ;
    --tw-backdrop-invert:  ;
    --tw-backdrop-opacity:  ;
    --tw-backdrop-saturate:  ;
    --tw-backdrop-sepia:  ;
  }

  .relative {
    position: relative;
  }

  .mb-16 {
    margin-bottom: 4rem;
  }

  .mb-2 {
    margin-bottom: 0.5rem;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }

  .mb-6 {
    margin-bottom: 1.5rem;
  }

  .mt-8 {
    margin-top: 2rem;
  }

  .flex {
    display: flex;
  }

  .h-9 {
    height: 2.25rem;
  }

  .max-h-full {
    max-height: 100%;
  }

  .min-h-\[calc\(100vh-83px\)\] {
    min-height: calc(100vh - 83px);
  }

  .min-h-full {
    min-height: 100%;
  }

  .w-\[calc\(100\%-theme\(space\.2\)-theme\(space\.2\)\)\] {
    width: calc(100% - 0.5rem - 0.5rem);
  }

  .w-full {
    width: 100%;
  }

  .max-w-\[1295px\] {
    max-width: 1295px;
  }

  .flex-1 {
    flex: 1 1 0%;
  }

  .flex-col {
    flex-direction: column;
  }

  .\!flex-nowrap {
    flex-wrap: nowrap !important;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .space-x-2 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-x-reverse: 0;
    margin-right: calc(0.5rem * var(--tw-space-x-reverse));
    margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
  }

  .overflow-hidden {
    overflow: hidden;
  }

  .rounded-2xl {
    border-radius: 1.25rem;
  }

  .rounded-lg {
    border-radius: 0.625rem;
  }

  .bg-gray-100 {
    --tw-bg-opacity: 1;
    background-color: rgb(248 249 251 / var(--tw-bg-opacity));
  }

  .bg-primary {
    background-color: var(--primary-color);
  }

  .bg-red {
    --tw-bg-opacity: 1;
    background-color: rgb(252 90 90 / var(--tw-bg-opacity));
  }

  .bg-white {
    --tw-bg-opacity: 1;
    background-color: rgb(255 255 255 / var(--tw-bg-opacity));
  }

  .bg-cover {
    background-size: cover;
  }

  .bg-center {
    background-position: center;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .px-5 {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .py-10 {
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }

  .py-5 {
    padding-top: 1.25rem;
    padding-bottom: 1.25rem;
  }

  .pb-8 {
    padding-bottom: 2rem;
  }

  .pt-4 {
    padding-top: 1rem;
  }

  .text-center {
    text-align: center;
  }

  .text-base {
    font-size: 1rem;
    line-height: 120%;
  }

  .text-lg {
    font-size: 1.125rem;
    line-height: 120%;
  }

  .text-sm {
    font-size: 0.875rem;
    line-height: 120%;
  }

  .text-xs {
    font-size: 0.75rem;
    line-height: 135%;
  }

  .font-medium {
    font-weight: 500;
  }

  .text-gray-300 {
    --tw-text-opacity: 1;
    color: rgb(136 134 159 / var(--tw-text-opacity));
  }

  .text-primary {
    color: var(--primary-color);
  }

  .text-textOnPrimary {
    color: var(--text-on-primary);
  }

  .text-white {
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / var(--tw-text-opacity));
  }

  .row-up-left {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: flex-start;
    justify-content: flex-start;
  }

  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: center;
    align-items: center;
    justify-content: center;
  }

  .column-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }

  @media (min-width: 1280px) {
    .text-5xl {
      font-size: 5.125rem;
      line-height: 100%;
      letter-spacing: -0.125rem;
    }

    .text-4xl {
      font-size: 3.5rem;
      line-height: 100%;
      letter-spacing: -0.0625rem;
    }

    .text-3xl {
      font-size: 3rem;
      line-height: 100%;
      letter-spacing: -0.0625rem;
    }

    .text-2xl {
      font-size: 2rem;
      line-height: 120%;
    }

    .text-xl {
      font-size: 1.5rem;
      line-height: 120%;
    }

    .text-lg {
      font-size: 1.25rem;
      line-height: 120%;
    }

    .text-base {
      font-size: 1.125rem;
      line-height: 120%;
    }

    .text-sm {
      font-size: 1rem;
      line-height: 120%;
    }

    .text-xs {
      font-size: 0.875rem;
      line-height: 120%;
    }
  }

  :root {
    --primary-color: #7d68f4;
    --primary-hover: #7e69f4;
    --text-on-primary: #ffffff;
  }

  svg {
    transform: translate3d(var(--tw-translate-x), var(--tw-translate-y), 0)
      rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
      scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  }

  *,
  *::before,
  *::after {
    text-underline-offset: 4px;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"] {
    -webkit-appearance: none;
    -moz-appearance: textfield !important;
  }

  [class^="uicon-"],
  [class*=" uicon-"] {
    line-height: 100%;
    letter-spacing: 0;
  }

  .placeholder\:text-gray-300::-moz-placeholder {
    --tw-text-opacity: 1;
    color: rgb(136 134 159 / var(--tw-text-opacity));
  }

  .placeholder\:text-gray-300::placeholder {
    --tw-text-opacity: 1;
    color: rgb(136 134 159 / var(--tw-text-opacity));
  }

  .hover\:bg-primaryHover:hover {
    background-color: var(--primary-hover);
  }

  .hover\:underline:hover {
    text-decoration-line: underline;
  }

  :is(.dark .dark\:bg-gray-600) {
    --tw-bg-opacity: 1;
    background-color: rgb(40 40 52 / var(--tw-bg-opacity));
  }

  :is(.dark .dark\:bg-gray-800) {
    --tw-bg-opacity: 1;
    background-color: rgb(20 20 26 / var(--tw-bg-opacity));
  }

  :is(.dark .dark\:text-white) {
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / var(--tw-text-opacity));
  }

  @media (min-width: 640px) {
    .sm\:min-h-\[700px\] {
      min-height: 700px;
    }

    .sm\:w-\[calc\(100\%-theme\(space\.16\)-theme\(space\.16\)\)\] {
      width: calc(100% - 4rem - 4rem);
    }

    .sm\:w-auto {
      width: auto;
    }

    .sm\:max-w-md {
      max-width: 28rem;
    }

    .sm\:justify-normal {
      justify-content: normal;
    }

    .sm\:bg-fixed {
      background-attachment: fixed;
    }

    .sm\:bg-left-top {
      background-position: left top;
    }

    .sm\:px-14 {
      padding-left: 3.5rem;
      padding-right: 3.5rem;
    }

    .sm\:py-14 {
      padding-top: 3.5rem;
      padding-bottom: 3.5rem;
    }

    .sm\:text-2xl {
      font-size: 1.5rem;
      line-height: 120%;
    }
  }

  @media (min-width: 1280px) {
    .md\:min-w-\[448px\] {
      min-width: 448px;
    }

    .md\:text-base {
      font-size: 1rem;
      line-height: 120%;
    }

    .md\:text-xs {
      font-size: 0.75rem;
      line-height: 135%;
    }
  }

  @media (max-height: 900px) and (min-width: 640px) {
    .short\:min-h-\[558px\] {
      min-height: 558px;
    }
  }
`;
