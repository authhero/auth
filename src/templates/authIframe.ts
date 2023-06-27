import { Controller } from "tsoa";

export default async function renderAuthIframe(
  controller: Controller,
  targetOrigin: string,
  response: string
) {
  const auth0Iframe = `<!DOCTYPE html>
  <html>
  
  <head>
      <title>Authorization Response</title>
  </head>
  
  <body>
      <script type="text/javascript">
          (function (window, document) {
              var targetOrigin = "${targetOrigin}";
              var webMessageRequest = {};
              var authorizationResponse = {
                  type: "authorization_response",
                  response: ${response}
              };
  
          var mainWin = (window.opener) ? window.opener : window.parent;
          if (webMessageRequest["web_message_uri"] && webMessageRequest["web_message_target"]) {
              window.addEventListener("message", function (evt) {
                  if (evt.origin != targetOrigin)
                      return;
                  switch (evt.data.type) {
                      case "relay_response":
                          var messageTargetWindow = evt.source.frames[webMessageRequest["web_message_target"]];
                          if (messageTargetWindow) {
                              messageTargetWindow.postMessage(authorizationResponse, webMessageRequest["web_message_uri"]);
                              window.close();
                          }
                          break;
                  }
              });
              mainWin.postMessage({
                  type: "relay_request"
              }, targetOrigin);
          } else {
              mainWin.postMessage(authorizationResponse, targetOrigin);
          }
          }
          ) (this, this.document);
      </script>
  </body>
  
  </html>`;

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  return auth0Iframe;
}
