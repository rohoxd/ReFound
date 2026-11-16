import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import NewListing from './pages/NewListing.jsx';
import ItemDetail from './pages/ItemDetail.jsx';

function NotFound() {
  return (
    <div className="page narrow">
      <h1>Page not found</h1>
      <p className="muted">That page doesn&rsquo;t exist. It may have been moved or the link is wrong.</p>
      <Link className="btn btn-primary" to="/">
        Back to listings
      </Link>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const postActive = pathname === '/new';
  const browseActive = pathname === '/' || pathname.startsWith('/item/');

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="wordmark" aria-label="ReFound home">
            <span className="wordmark-hole" aria-hidden="true" />
            ReFound
          </Link>
          <nav className="nav" aria-label="Main">
            <Link to="/" className={browseActive ? 'is-active' : ''} aria-current={browseActive ? 'page' : undefined}>
              Browse
            </Link>
            <Link
              to="/new"
              className={`nav-post ${postActive ? 'is-active' : ''}`}
              aria-current={postActive ? 'page' : undefined}
            >
              Post an item
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewListing />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>ReFound is a campus lost &amp; found board. Meet in a public place when you hand an item back.</p>
      </footer>
    </>
  );
}
