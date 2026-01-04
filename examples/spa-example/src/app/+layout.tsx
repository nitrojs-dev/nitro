import { Outlet, Link } from 'nitro-js/router';

export default function RootLayout() {
  return (
    <div>
      <>
        <meta charSet="UTF-8" />
        <title>Nitro.js SPA Example</title>
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
          }
          nav a:hover {
            text-decoration: underline;
          }
          main {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}</style>
      </>
      <div>
        <div id="root">
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/posts">Posts</Link>
          </nav>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}