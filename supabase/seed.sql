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
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'Neon Rift', 'neon-rift', 'Johannesburg', '22 Victory Road, JHB', 'Competitive arcade hosting fresh SA tournaments and live streams.', 'info@neonrift.co.za', '+27719990011', null, null, ARRAY['MK1','KOFXV','Naruto'], '3 Xbox Series X booths plus a dedicated streaming desk.', -26.2041, 28.0473, true);

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

