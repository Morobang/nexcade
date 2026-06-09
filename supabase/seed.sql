-- Demo seed data for NexCade

-- Demo auth users for profiles
INSERT INTO auth.users (id, aud, role, email, email_confirmed_at, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001','authenticated','authenticated','blaze@nexcade.test',now(),now()),
  ('00000000-0000-0000-0000-000000000002','authenticated','authenticated','jinx@nexcade.test',now(),now()),
  ('00000000-0000-0000-0000-000000000003','authenticated','authenticated','slinky@nexcade.test',now(),now()),
  ('00000000-0000-0000-0000-000000000004','authenticated','authenticated','nyla@nexcade.test',now(),now()),
  ('00000000-0000-0000-0000-000000000005','authenticated','authenticated','vex@nexcade.test',now(),now()),
  ('00000000-0000-0000-0000-000000000006','authenticated','authenticated','arcade.owner1@nexcade.test',now(),now()),
  ('00000000-0000-0000-0000-000000000007','authenticated','authenticated','arcade.owner2@nexcade.test',now(),now());

-- Demo player profiles
INSERT INTO public.profiles (id, full_name, gamer_tag, email, role, phone, psn_id, avatar_url, bio)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Thabo Mokoena', 'BlazeSA', 'blaze@nexcade.test', 'player', '+27711234567', 'BlazeSA', null, 'Cape Town power player with aggressive FC26 style.'),
  ('00000000-0000-0000-0000-000000000002', 'Lerato Radebe', 'Jinx', 'jinx@nexcade.test', 'player', '+27712223344', 'JinxTek', null, 'Tekken veteran and local tournament favorite.'),
  ('00000000-0000-0000-0000-000000000003', 'Sipho Nkosi', 'Slinky', 'slinky@nexcade.test', 'player', '+27713334455', null, null, 'MK1 specialist known for clutch finishes.'),
  ('00000000-0000-0000-0000-000000000004', 'Nyla Adams', 'Nova', 'nyla@nexcade.test', 'player', '+27714445566', null, null, 'Naruto main with lightning-fast team setups.'),
  ('00000000-0000-0000-0000-000000000005', 'Vex Patel', 'Vexx', 'vex@nexcade.test', 'player', '+27715556677', null, null, 'KOFXV contender with strong zoning and reads.'),
  ('00000000-0000-0000-0000-000000000006', 'Ayesha Khan', 'RiftOwner', 'arcade.owner1@nexcade.test', 'arcade_owner', '+27716667788', null, null, 'Owner of Rocket Arena and organiser of SA tournaments.'),
  ('00000000-0000-0000-0000-000000000007', 'Jaco van der Merwe', 'NeonBoss', 'arcade.owner2@nexcade.test', 'arcade_owner', '+27717778899', null, null, 'Owner of Neon Rift and streaming event host.');

-- Demo arcades
INSERT INTO public.arcades (id, owner_id, name, slug, city, address, description, contact_email, whatsapp_number, logo_url, cover_url, games_supported, console_setup, latitude, longitude, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Rocket Arena', 'rocket-arena', 'Cape Town', '10 Arcade Lane, Cape Town', 'South Africa''s premier fighting game arcade with nightly events.', 'hello@rocketarena.co.za', '+27718889900', null, null, ARRAY['FC26','Tekken8','SF6'], '4 PS5 stations with tournament seating and broadcast setup.', -33.9249, 18.4241, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'Neon Rift', 'neon-rift', 'Johannesburg', '22 Victory Road, JHB', 'Competitive arcade hosting fresh SA tournaments and live streams.', 'info@neonrift.co.za', '+27719990011', null, null, ARRAY['MK1','KOFXV','Naruto'], '3 Xbox Series X booths plus a dedicated streaming desk.', -26.2041, 28.0473, true),
  ('10000000-0000-0000-0000-000000000003', null, 'Pixel Bunker', 'pixel-bunker', 'Pretoria', '5 Church Street, Pretoria CBD', 'Pretoria''s go-to spot for Tekken and KOF tournaments every weekend.', 'play@pixelbunker.co.za', '+27721112233', null, null, ARRAY['Tekken8','KOFXV','MK1'], '5 PS5 setups with surround sound and stream-ready rigs.', -25.7479, 28.2293, true),
  ('10000000-0000-0000-0000-000000000004', null, 'The Arena', 'the-arena', 'Durban', '14 Smith Street, Durban CBD', 'Durban''s biggest fighting game venue running weekly cash tournaments.', 'hello@thearena.co.za', '+27733334455', null, null, ARRAY['SF6','Tekken8','FC26'], '6 PS5 stations plus a chill spectator section.', -29.8587, 31.0218, true),
  ('10000000-0000-0000-0000-000000000005', null, 'Kombat Zone', 'kombat-zone', 'Sandton', '3 Rivonia Road, Sandton', 'Sandton''s premium arcade — high-end setups and monthly prize pools.', 'info@kombatzone.co.za', '+27745556677', null, null, ARRAY['MK1','SF6','Tekken8'], '4 high-spec gaming stations with broadcast capabilities.', -26.1076, 28.0567, true),
  ('10000000-0000-0000-0000-000000000006', null, 'Hyper Gaming', 'hyper-gaming', 'Centurion', '21 Gordon Hood Ave, Centurion', 'Family-friendly competitive gaming space with open tournaments.', 'contact@hypergaming.co.za', '+27757778899', null, null, ARRAY['FC26','Naruto','KOFXV'], '3 Xbox Series X and 2 PS5 stations.', -25.8600, 28.1880, true),
  ('10000000-0000-0000-0000-000000000007', null, 'Game Lab', 'game-lab', 'Gqeberha', '8 Cape Road, Gqeberha', 'The Eastern Cape''s first dedicated FGC arcade. Tekken and Naruto nights weekly.', 'gamelab@gmail.com', '+27769990011', null, null, ARRAY['Tekken8','Naruto','KOFXV'], '4 PS5 setups with custom arcade sticks.', -33.9608, 25.6022, true),
  ('10000000-0000-0000-0000-000000000008', null, 'Battle Dome', 'battle-dome', 'East London', '7 Oxford Street, East London', 'East London''s competitive FGC hub running monthly invitationals.', 'battledome@mail.co.za', '+27771112233', null, null, ARRAY['MK1','FC26','SF6'], '3 PS5 stations and a wall-mounted bracket display.', -32.9976, 27.8756, true),
  ('10000000-0000-0000-0000-000000000009', null, 'The Grid', 'the-grid', 'Bloemfontein', '12 Maitland Street, Bloemfontein', 'Free State''s only dedicated tournament arcade.', 'thegrid@gaming.co.za', '+27783334455', null, null, ARRAY['Tekken8','SF6','MK1'], '3 PS5 stations with open-bracket format.', -29.1211, 26.2140, true),
  ('10000000-0000-0000-0000-000000000010', null, 'Power Level', 'power-level', 'Soweto', '33 Vilakazi Street, Soweto', 'Soweto''s home of competitive gaming with strong KOFXV and Naruto scenes.', 'powerlevel@gaming.co.za', '+27795556677', null, null, ARRAY['KOFXV','Naruto','MK1'], '4 PS5 stations and a dedicated training room.', -26.2674, 27.8585, true),
  ('10000000-0000-0000-0000-000000000011', null, 'Street Level', 'street-level', 'Midrand', '18 New Road, Midrand', 'Midrand arcade connecting JHB and PTA players with midweek tournaments.', 'streetlevel@co.za', '+27707778899', null, null, ARRAY['SF6','Tekken8','FC26'], '5 PS5 stations with weekly ladder system.', -25.9980, 28.1280, true),
  ('10000000-0000-0000-0000-000000000012', null, 'Arcade Underground', 'arcade-underground', 'Boksburg', '2 Leeuwpoort Street, Boksburg', 'East Rand''s underground FGC spot with loyal weekly crowds.', 'arcadeug@gaming.co.za', '+27711112233', null, null, ARRAY['MK1','KOFXV','Tekken8'], '3 PS5 setups in a dedicated basement arena.', -26.2140, 28.2500, true),
  ('10000000-0000-0000-0000-000000000013', null, 'Neo Fighter', 'neo-fighter', 'Pietermaritzburg', '9 Longmarket Street, PMB', 'KZN inland''s competitive gaming lounge with weekend tournaments.', 'neofighter@mail.co.za', '+27723334455', null, null, ARRAY['Tekken8','Naruto','SF6'], '3 PS5 stations with LAN capability.', -29.5877, 30.3813, true),
  ('10000000-0000-0000-0000-000000000014', null, 'Clutch Gaming', 'clutch-gaming', 'Benoni', '6 Tom Jones Street, Benoni', 'East Rand hidden gem with some of SA''s strongest FC26 players.', 'clutch@gaming.co.za', '+27735556677', null, null, ARRAY['FC26','MK1','SF6'], '4 PS5 setups with custom tournament brackets.', -26.1861, 28.3180, true),
  ('10000000-0000-0000-0000-000000000015', null, 'Final Round', 'final-round', 'Roodepoort', '11 Main Reef Road, Roodepoort', 'West Rand''s premier FGC destination with monthly open brackets.', 'finalround@gaming.co.za', '+27747778899', null, null, ARRAY['SF6','Tekken8','KOFXV'], '4 PS5 stations with bracket display screens.', -26.1627, 27.8730, true),
  ('10000000-0000-0000-0000-000000000016', null, 'Game Over', 'game-over', 'Polokwane', '25 Landdros Mare Street, Polokwane', 'Limpopo''s only serious FGC arcade — running Tekken and MK1 brackets.', 'gameover@gaming.co.za', '+27751112233', null, null, ARRAY['Tekken8','MK1','KOFXV'], '3 PS5 stations with open community play.', -23.9045, 29.4688, true),
  ('10000000-0000-0000-0000-000000000017', null, 'Versus', 'versus', 'Mbombela', '7 Paul Kruger Street, Mbombela', 'Mpumalanga''s competitive gaming spot with growing SF6 and Naruto scenes.', 'versus@gaming.co.za', '+27763334455', null, null, ARRAY['SF6','Naruto','FC26'], '3 PS5 stations and a stream desk.', -25.4745, 30.9699, true),
  ('10000000-0000-0000-0000-000000000018', null, 'The Pit', 'the-pit', 'George', '4 York Street, George', 'Garden Route arcade with biweekly tournaments and a chill vibe.', 'thepit@gaming.co.za', '+27775556677', null, null, ARRAY['Tekken8','MK1','KOFXV'], '3 PS5 setups with wall-mounted TVs.', -33.9630, 22.4617, true),
  ('10000000-0000-0000-0000-000000000019', null, 'Retro Rumble', 'retro-rumble', 'Klerksdorp', '15 Boom Street, Klerksdorp', 'North West''s fighting game hub mixing retro classics with modern titles.', 'retrorumble@co.za', '+27787778899', null, null, ARRAY['KOFXV','SF6','Naruto'], '3 stations with classic arcade sticks and modern pads.', -26.8672, 26.6689, true),
  ('10000000-0000-0000-0000-000000000020', null, 'Level Up', 'level-up', 'Vanderbijlpark', '3 Frikkie Meyer Blvd, Vanderbijlpark', 'Vaal Triangle arcade bringing competitive gaming to the south of JHB.', 'levelup@gaming.co.za', '+27791112233', null, null, ARRAY['FC26','Tekken8','MK1'], '4 PS5 setups with HDMI capture for streaming.', -26.7034, 27.8344, true),
  ('10000000-0000-0000-0000-000000000021', null, 'Fighter''s Den', 'fighters-den', 'Emalahleni', '9 Mandela Street, Emalahleni', 'Mpumalanga coal belt''s surprise FGC spot — tight-knit community.', 'fightersden@gaming.co.za', '+27703334455', null, null, ARRAY['MK1','Tekken8','Naruto'], '3 PS5 stations with weekly community brackets.', -25.8751, 29.2354, true),
  ('10000000-0000-0000-0000-000000000022', null, 'Arcade City', 'arcade-city', 'Kimberley', '22 Du Toitspan Road, Kimberley', 'Northern Cape''s first competitive gaming arcade — diamond city, diamond players.', 'arcadecity@gaming.co.za', '+27715556677', null, null, ARRAY['SF6','KOFXV','FC26'], '3 PS5 stations with a growing local scene.', -28.7282, 24.7499, true);

-- Link home arcades for player profiles
UPDATE public.profiles
SET home_arcade_id = CASE id
  WHEN '00000000-0000-0000-0000-000000000001' THEN '10000000-0000-0000-0000-000000000001'
  WHEN '00000000-0000-0000-0000-000000000002' THEN '10000000-0000-0000-0000-000000000001'
  WHEN '00000000-0000-0000-0000-000000000003' THEN '10000000-0000-0000-0000-000000000002'
  WHEN '00000000-0000-0000-0000-000000000004' THEN '10000000-0000-0000-0000-000000000002'
  WHEN '00000000-0000-0000-0000-000000000005' THEN '10000000-0000-0000-0000-000000000001'
  ELSE home_arcade_id
END
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005'
);

-- Demo tournaments
INSERT INTO public.tournaments (id, arcade_id, name, slug, game_type, format, status, description, rules, start_at, end_at, entry_fee, prize_pool, max_players, is_streamed, stream_url, venue, registration_deadline)
VALUES
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Rocket Arena FC26 Open','rocket-arena-fc26-open','FC26','knockout','open','A fast-paced FC26 tournament with bronze to pro brackets.','Standard FC26 ruleset applies. No pause during matches.', '2026-09-15 18:00:00+00', '2026-09-15 21:00:00+00', 120.00, 5000.00, 16, true, 'https://www.youtube.com/embed/dQw4w9WgXcQ','Rocket Arena Main Hall','2026-09-14 18:00:00+00'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Tekken8 Showdown','rocket-arena-tekken8-showdown','Tekken8','knockout','live','Live Tekken8 bracket with top Cape Town competitors.','Winner advances to the regional ladder. No food in the tournament area.', '2026-08-22 19:00:00+00', '2026-08-22 23:00:00+00', 80.00, 3000.00, 12, true, 'https://www.youtube.com/embed/dQw4w9WgXcQ','Rocket Arena Side Stage','2026-08-21 17:00:00+00'),
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Neon Rift MK1 Mayhem','neon-rift-mk1-mayhem','MK1','knockout','open','Midweek Mortal Kombat 1 event with cash prizes.','Standard MK1 tournament rules. Matches best of 3.', '2026-08-28 18:30:00+00', '2026-08-28 22:00:00+00', 100.00, 3500.00, 14, false, null,'Neon Rift Arena','2026-08-27 18:00:00+00'),
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','Naruto Ultimate Clash','neon-rift-naruto-ultimate-clash','Naruto','league','completed','Arcade Naruto league event with support characters and team matchups.','Matches played in 3-round sets with support bans allowed.', '2026-07-10 17:00:00+00', '2026-07-10 21:00:00+00', 90.00, 2800.00, 12, false, null,'Neon Rift Battle Room','2026-07-09 17:00:00+00');

-- Demo registrations
INSERT INTO public.registrations (id, tournament_id, profile_id, registration_status, payment_status, booking_ref, team_name, team_type, character_1, character_2, character_3, support_character, rules_agreed, registered_at, paid_at, checked_in_at)
VALUES
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','paid','paid','BOOKING-001','Blaze Squad','Duo','', '', '', '', true, '2026-09-01 10:00:00+00','2026-09-01 10:30:00+00', null),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','registered','pending','BOOKING-002', null, null,'Kazuya', '', '', '', true, '2026-08-10 14:00:00+00', null, null),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','paid','paid','BOOKING-003', null, null,'Liu Kang', '', '', '', true, '2026-08-18 16:00:00+00','2026-08-18 16:20:00+00', null),
  ('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','paid','paid','BOOKING-004', null, null,'Naruto','Sasuke','Sakura','Kakashi', true, '2026-07-01 11:00:00+00','2026-07-01 11:30:00+00', '2026-07-10 17:10:00+00'),
  ('30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','registered','pending','BOOKING-005', null, null,'', '', '', '', true, '2026-09-02 12:00:00+00', null, null);

-- Demo results for completed Naruto event
INSERT INTO public.results (id, tournament_id, profile_id, placement, is_winner, points_awarded, result_data, recorded_at)
VALUES
  ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004',1,true,100,'{"team":"Naruto/Sasuke","score":"3-1"}', '2026-07-10 21:05:00+00'),
  ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005',2,false,60,'{"team":"Vexx Squad","score":"2-3"}', '2026-07-10 21:05:00+00');

-- Demo news posts
INSERT INTO public.news_posts (id, title, slug, excerpt, content, category, author_id, published_at, is_published)
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
    '00000000-0000-0000-0000-000000000001',
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
1. Nova (Naruto / Sasuke) — dominant in the team-based sets, going 10-1 overall
2. Vex — pushed Nova all the way in the final, losing 2-3 in a nailbiter
3. BlazeSA — third place on tiebreaker after finishing level on points with Jinx

Nova walked away with R2 800 in prize money and a spot on the NexCade national leaderboard.

The next Neon Rift event is the MK1 Mayhem on 28 August. Spots are filling fast.',
    'Recap',
    '00000000-0000-0000-0000-000000000002',
    '2026-07-11 09:00:00+00',
    true
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    'How NexCade Brackets Work',
    'how-nexcade-brackets-work',
    'Single elimination, group stage, league round-robin — here is a breakdown of the tournament formats you will find on NexCade.',
    'NexCade supports three tournament formats, each suited to a different kind of event.

Single Elimination (Knockout)
The classic format. Lose once and you are out. Best for events with tight time slots or large prize pools where you want fast, high-stakes matches from round one. NexCade automatically generates the bracket and tracks results in real time.

Group Stage + Knockout
Used for larger events where you want everyone to play multiple matches before the knockout rounds begin. Players are split into groups and play a mini round-robin. The top finishers from each group advance to the knockout bracket. This format is coming to NexCade in Milestone 3.

League (Round Robin)
Every player faces every other player. The leaderboard is decided on total points — three for a win, one for a draw, zero for a loss. Great for smaller weekly events where community building matters more than a single champion. The Naruto Ultimate Clash used this format.

More format options and seeding controls are on the roadmap. If your arcade has specific needs, reach out through the contact page.',
    'Community',
    '00000000-0000-0000-0000-000000000001',
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
    '00000000-0000-0000-0000-000000000001',
    '2026-08-05 08:00:00+00',
    true
  );

