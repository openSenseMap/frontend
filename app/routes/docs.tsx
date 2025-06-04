import { type LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Return the Swagger UI HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>openSenseMap API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
      <style>
        html {
          box-sizing: border-box;
          overflow: -moz-scrollbars-vertical;
          overflow-y: scroll;
        }
        *, *:before, *:after {
          box-sizing: inherit;
        }
        body {
          margin: 0;
          background: #fafafa;
        }
                  /* Custom header with logo */
        .api-header {
          background: #ffffff;
          text-align: left;
          padding: 10px 10px;
          border-bottom: 2px solid #e8e8e8;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .api-header img {
          max-width: 300px;
          height: auto;
          margin-bottom: 10px;
        }
        
        .api-header h1 {
          margin: 0;
          color: #3b4151;
          font-family: sans-serif;
          font-size: 24px;
          font-weight: 600;
        }
        
        /* Hide the default Swagger UI title */
        .info .title {
          display: none;
        }
      </style>
    </head>
    <body>
          <!-- Custom header with logo -->
      <div class="api-header">
        <img src="../../public/openSenseMap_API.png" alt="openSenseMap API" />
      </div>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/api/docs/spec',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            validatorUrl: null,
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
            onComplete: function() {
              console.log('Swagger UI loaded successfully');
            }
          });
        };
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
};