// Store contacts and social profiles from Theme settings > Store details: theme/snippets/store-contacts.liquid
// and snippets/social-links.liquid
import Icon from './Icon.js';
import { getSettings } from '@/lib/theme.js';

export function StoreContacts() {
  const s = getSettings();
  const items = [
    s.store_address && ['map-pin', <span key="a">{s.store_address}</span>],
    s.store_phone && [
      'phone',
      <a key="p" href={`tel:${s.store_phone.replace(/[\s()-]/g, '')}`}>
        {s.store_phone}
      </a>,
    ],
    s.store_email && [
      'mail',
      <a key="e" href={`mailto:${s.store_email}`}>
        {s.store_email}
      </a>,
    ],
    s.store_hours && ['clock', <span key="h">{s.store_hours}</span>],
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <address className="store-contacts">
      {items.map(([icon, content]) => (
        <p key={icon} className="store-contacts__item">
          <Icon name={icon} />
          {content}
        </p>
      ))}
    </address>
  );
}

const NETWORKS = ['instagram', 'facebook', 'tiktok', 'youtube', 'telegram', 'pinterest'];

export function SocialLinks() {
  const s = getSettings();
  const links = NETWORKS.filter((name) => s[`social_${name}`]);
  if (!links.length) return null;
  return (
    <ul className="social-links" role="list">
      {links.map((name) => (
        <li key={name}>
          <a
            href={s[`social_${name}`]}
            className="social-links__link"
            target="_blank"
            rel="noopener"
            aria-label={name[0].toUpperCase() + name.slice(1)}
          >
            <Icon name={name} />
          </a>
        </li>
      ))}
    </ul>
  );
}
