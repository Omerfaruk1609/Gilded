export const customCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  body {
    background-color: #0b0f19 !important;
    color: #f1f5f9 !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
  }

  .swagger-ui {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    color: #f1f5f9 !important;
  }

  /* Topbar Styling */
  .swagger-ui .topbar {
    background-color: #090d16 !important;
    border-bottom: 1px solid #1e293b !important;
    padding: 14px 0 !important;
  }

  .swagger-ui .topbar a span {
    font-weight: 700 !important;
    font-size: 1.1rem !important;
    color: #f59e0b !important;
  }

  .swagger-ui .topbar .topbar-wrapper img {
    content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏮</text></svg>');
    height: 32px !important;
    width: 32px !important;
  }

  /* Info Container */
  .swagger-ui .info {
    margin: 30px 0 !important;
    background: #0f172a !important;
    padding: 24px !important;
    border-radius: 16px !important;
    border: 1px solid #1e293b !important;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5) !important;
  }

  .swagger-ui .info .title {
    color: #fbbf24 !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em !important;
  }

  .swagger-ui .info p, .swagger-ui .info li {
    color: #94a3b8 !important;
    font-size: 0.92rem !important;
  }

  .swagger-ui .info a {
    color: #38bdf8 !important;
  }

  /* Operation Blocks */
  .swagger-ui .opblock {
    background: #0f172a !important;
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    margin-bottom: 16px !important;
  }

  .swagger-ui .opblock .opblock-summary {
    border-bottom: 1px solid transparent !important;
    padding: 12px 16px !important;
  }

  .swagger-ui .opblock-summary-method {
    border-radius: 8px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-weight: 700 !important;
    padding: 6px 12px !important;
  }

  .swagger-ui .opblock-post {
    border-color: rgba(16, 185, 129, 0.3) !important;
    background: rgba(16, 185, 129, 0.03) !important;
  }

  .swagger-ui .opblock-post .opblock-summary-method {
    background: #10b981 !important;
  }

  .swagger-ui .opblock-get {
    border-color: rgba(56, 189, 248, 0.3) !important;
    background: rgba(56, 189, 248, 0.03) !important;
  }

  .swagger-ui .opblock-get .opblock-summary-method {
    background: #0284c7 !important;
  }

  .swagger-ui .opblock-delete {
    border-color: rgba(244, 63, 94, 0.3) !important;
    background: rgba(244, 63, 94, 0.03) !important;
  }

  .swagger-ui .opblock-delete .opblock-summary-method {
    background: #e11d48 !important;
  }

  .swagger-ui .opblock-summary-path {
    color: #f8fafc !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.95rem !important;
  }

  .swagger-ui .opblock-summary-description {
    color: #94a3b8 !important;
  }

  /* Body & Params Tables */
  .swagger-ui .opblock-body {
    background: #0b0f19 !important;
    padding: 20px !important;
  }

  .swagger-ui table thead tr th, .swagger-ui table thead tr td {
    color: #cbd5e1 !important;
    border-bottom: 1px solid #1e293b !important;
  }

  .swagger-ui table tbody tr td {
    border-bottom: 1px solid #1e293b !important;
    color: #94a3b8 !important;
  }

  .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
    background: #020617 !important;
    border: 1px solid #1e293b !important;
    color: #f1f5f9 !important;
    border-radius: 8px !important;
    font-family: 'JetBrains Mono', monospace !important;
    padding: 8px 12px !important;
  }

  .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus {
    border-color: #6366f1 !important;
    outline: none !important;
  }

  /* Buttons */
  .swagger-ui .btn {
    border-radius: 8px !important;
    font-weight: 600 !important;
    border: 1px solid #334155 !important;
    background: #1e293b !important;
    color: #f1f5f9 !important;
  }

  .swagger-ui .btn.execute {
    background: #6366f1 !important;
    border-color: #4f46e5 !important;
    color: #ffffff !important;
  }

  .swagger-ui .btn.execute:hover {
    background: #4f46e5 !important;
  }

  .swagger-ui .btn.try-out__btn {
    border-color: #f59e0b !important;
    color: #fbbf24 !important;
  }

  /* Response Blocks */
  .swagger-ui .responses-wrapper, .swagger-ui .response-col_status, .swagger-ui .response-col_description {
    color: #e2e8f0 !important;
  }

  .swagger-ui highlight-code pre, .swagger-ui .microlight {
    background: #020617 !important;
    border-radius: 10px !important;
    border: 1px solid #1e293b !important;
    color: #38bdf8 !important;
  }

  .swagger-ui .scheme-container {
    background: #0f172a !important;
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    box-shadow: none !important;
  }

  .swagger-ui section.models {
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    background: #0f172a !important;
  }

  .swagger-ui section.models h7 {
    color: #f59e0b !important;
  }
`;
