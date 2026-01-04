import { Outlet, Link } from 'nitro-js/router';

export default function RootLayout() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nitro.js SSR Example</title>
        <style>{`
          body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          nav {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          nav a {
            margin-right: 1rem;
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: all 0.2s;
          }
          nav a:hover {
            background: #e3f2fd;
            text-decoration: none;
          }
          main {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            min-height: 600px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .ssr-badge {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .ssr-badge::before {
            content: "⚡";
            margin-right: 0.5rem;
          }
        `}</style>
      </head>
      <body>
        <div id="root">
          <div className="ssr-badge">SSR Mode</div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/posts">Posts</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
          <main>
            <Outlet />
          </main>
        </div>
      </body>
    </html>
  );
}