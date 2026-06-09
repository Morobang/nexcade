-- Seed demo news posts for existing databases
INSERT INTO public.news_posts (id, title, slug, excerpt, content, category, published_at, is_published)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    'NexCade Launches Across South Africa',
    'nexcade-launches-across-south-africa',
    'The gaming tournament platform built for SA arcades is now live. Register your arcade or sign up as a player today.',
    'After months of development and testing with partner arcades across the country, NexCade is officially live.

The platform connects arcade venues with competitive players, making it easy to host and enter tournaments for games like FC26, Tekken 8, Street Fighter 6, Mortal Kombat 1, and more.

Arcades can now create tournament listings, manage registrations, and stream events directly through NexCade. Players get a unified profile, a public leaderboard ranking, and an easy way to find events near them.

We are starting with arcades in Cape Town, Johannesburg, Durban, and Pretoria, with more venues joining every week.

Head to the Arcades page to find a venue near you, or check the Tournaments page to see what is coming up in your city.',
    'Announcement',
    '2026-06-01 10:00:00+00',
    true
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'Recap: Neon Rift Naruto Ultimate Clash',
    'recap-neon-rift-naruto-ultimate-clash',
    'Nova claimed first place at the Naruto Ultimate Clash held at Neon Rift, Johannesburg. Here is how it went down.',
    'The Naruto Ultimate Clash at Neon Rift in Johannesburg went off without a hitch on 10 July 2026, drawing 12 players from across Gauteng.

The format was a full round-robin league, with every player facing every other in a set of three rounds. Support character bans added an extra layer of strategy that kept the crowd guessing throughout the day.

Top 3 finishers:
1. Nova (Naruto / Sasuke) - dominant in the team-based sets, going 10-1 overall
2. Vex - pushed Nova all the way in the final, losing 2-3 in a nailbiter
3. BlazeSA - third place on tiebreaker after finishing level on points with Jinx

Nova walked away with R2 800 in prize money and a spot on the NexCade national leaderboard.

The next Neon Rift event is the MK1 Mayhem on 28 August. Spots are filling fast.',
    'Recap',
    '2026-07-11 09:00:00+00',
    true
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    'How NexCade Brackets Work',
    'how-nexcade-brackets-work',
    'Single elimination, group stage, league round-robin - here is a breakdown of the tournament formats you will find on NexCade.',
    'NexCade supports three tournament formats, each suited to a different kind of event.

Single Elimination (Knockout)
The classic format. Lose once and you are out. Best for events with tight time slots or large prize pools where you want fast, high-stakes matches from round one. NexCade automatically generates the bracket and tracks results in real time.

Group Stage + Knockout
Used for larger events where you want everyone to play multiple matches before the knockout rounds begin. Players are split into groups and play a mini round-robin. The top finishers from each group advance to the knockout bracket. This format is coming to NexCade in Milestone 3.

League (Round Robin)
Every player faces every other player. The leaderboard is decided on total points - three for a win, one for a draw, zero for a loss. Great for smaller weekly events where community building matters more than a single champion. The Naruto Ultimate Clash used this format.

More format options and seeding controls are on the roadmap. If your arcade has specific needs, reach out through the contact page.',
    'Community',
    '2026-07-20 11:00:00+00',
    true
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    'Street Fighter 6 Added to the NexCade Game Roster',
    'street-fighter-6-added-to-nexcade-roster',
    'SF6 is now available as a tournament game type on NexCade. Arcades can start listing SF6 events from today.',
    'Street Fighter 6 has been added to the NexCade game roster, joining FC26, Tekken 8, Mortal Kombat 1, King of Fighters XV, and Naruto Ultimate Ninja Storm.

SF6 has seen strong growth in the South African competitive scene since its release, with active communities in Cape Town and Johannesburg. We have been in talks with a number of arcades that run weekly SF6 sessions and they will be listing their first NexCade events shortly.

What this means for players:
- SF6 events will appear on the Tournaments page
- SF6 results will feed into the NexCade leaderboard
- Your SF6 wins count toward the Season Points ladder

If you run an SF6 event at your arcade and want to list it on NexCade, get in touch.',
    'News',
    '2026-08-05 08:00:00+00',
    true
  )
ON CONFLICT (slug) DO NOTHING;
