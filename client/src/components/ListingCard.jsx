import { Link } from 'react-router-dom';
import { formatDate, timeAgo } from '../utils.js';

export default function ListingCard({ item }) {
  const isLost = item.type === 'lost';
  const closed = item.status === 'closed';

  return (
    <Link
      to={`/item/${item.id}`}
      className={`card ${isLost ? 'card-lost' : 'card-found'} ${closed ? 'card-closed' : ''}`}
    >
      <div className="card-band">
        <span className="card-hole" aria-hidden="true" />
        <span className="card-type">{isLost ? 'Lost' : 'Found'}</span>
        <span className={`pill ${closed ? 'pill-closed' : 'pill-open'}`}>{closed ? 'Closed' : 'Open'}</span>
      </div>

      <div className="card-photo">
        {item.photo_path ? (
          <img src={item.photo_path} alt={item.item_name} loading="lazy" />
        ) : (
          <div className="card-photo-empty" aria-hidden="true">
            {item.category.charAt(0)}
          </div>
        )}
      </div>

      <div className="card-body">
        <h3>{item.item_name}</h3>
        <p className="card-meta">{item.category}</p>
        <p className="card-meta">{item.location}</p>
        <p className="card-meta card-date">
          {isLost ? 'Lost' : 'Found'} {formatDate(item.date)} &middot; posted {timeAgo(item.created_at)}
        </p>
      </div>
    </Link>
  );
}
