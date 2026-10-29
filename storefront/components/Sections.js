// Renders the sections of a theme JSON template or section group (lib/theme.js getSections) with their
// React counterparts, each in the wrapper Shopify adds (.shopify-section + the schema's class + the
// group class), so the theme's CSS that relies on it applies. Types without a counterpart yet are skipped.
import AnnouncementBar from './sections/AnnouncementBar.js';
import CountdownBar from './sections/CountdownBar.js';
import Header from './sections/Header.js';

export const SECTIONS = {
  'announcement-bar': AnnouncementBar,
  'countdown-bar': CountdownBar,
  header: Header,
};

export default function Sections({ sections, group, ...props }) {
  return sections.map((section) => {
    const Section = SECTIONS[section.type];
    if (!Section) return null;
    const className = ['shopify-section', group && `shopify-section-group-${group}`, section.className].filter(Boolean).join(' ');
    return (
      <div key={section.id} id={`shopify-section-${section.id}`} className={className}>
        <Section section={section} {...props} />
      </div>
    );
  });
}
