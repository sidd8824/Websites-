import { EVENTS } from '../data/club';
import { categorizeEvents } from '../utils/clubUtils';
import CrtEventBrowser from './crt/CrtEventBrowser';

export default function EventsSection() {
  const { heroEvent, upcomingEvents } = categorizeEvents(EVENTS);
  const events = [heroEvent, ...upcomingEvents].filter(event => event.status !== 'completed');

  return (
    <section id="events" aria-labelledby="events-heading"
      className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
      <h2 id="events-heading" className="sr-only">Upcoming events</h2>
      {events.length > 0 ? <CrtEventBrowser events={events} /> : (
        <p className="text-center font-mono text-sm text-[#bfcabb]">No upcoming events are scheduled.</p>
      )}
    </section>
  );
}
