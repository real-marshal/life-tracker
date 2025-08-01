import { deleteDatabaseAsync, SQLiteDatabase } from 'expo-sqlite'

export async function initSqlite(db: SQLiteDatabase) {
  return db.execAsync('PRAGMA foreign_keys = ON')
}

export async function seed(db: SQLiteDatabase) {
  return db.execAsync(`
    -- user
    insert into user(name)
    values ('Real_Marshal');

    -- metastats
    insert into metastat(name, value, level)
    values ('Health', 0.5, 0);

    insert into metastat(name, value, level)
    values ('Knowledge', 0.5, 0);

    insert into metastat(name, value)
    values ('Mental', 0.5);

    -- lt goals
    insert into goal(name, type, status, why, created_at, render_data)
    values ('Move out', 'longterm', 'active', 'Everyone should have their own space...',
            '2025-07-19T21:46:00.000Z', '{}');

    insert into goal(name, type, status, created_at, render_data)
    values ('Buy a car', 'longterm', 'active', '2025-07-19T21:56:00.000Z', '{}');

    insert into goal(name, type, status, why, created_at, render_data)
    values ('Find a partner', 'longterm', 'active', 'I mean...', '2025-07-20T20:15:00.000Z', '{}');

    -- goals
    insert into goal(name, type, status, why, created_at, render_data)
    values ('Create an X account about 2000-2015 vibes', 'normal', 'active',
            'Tweets nowadays can be monetized so there''s a chance to make some passive money...',
            '2025-07-21T14:46:00.000Z', '{"index":0}');

    insert into goal(name, type, status, created_at, render_data)
    values ('Resolve army problems', 'normal', 'active', '2025-07-20T15:12:00.000Z', '{"index":1}');

    insert into goal(name, type, status, created_at, render_data)
    values ('Fix eyes', 'normal', 'active', '2025-07-20T15:13:00.000Z', '{"index":2}');

    insert into goal(name, type, status, created_at, render_data)
    values ('Build a goal tracking app', 'normal', 'active', '2025-07-22T13:41:00.000Z',
            '{"index":3}');

    insert into goal(name, type, status, created_at, render_data)
    values ('Gain some weight', 'normal', 'active', '2025-07-20T15:11:00.000Z', '{"index":4}');

    -- delayed goals
    insert into goal(name, type, status, created_at, render_data)
    values ('Finish connectiqa?', 'normal', 'delayed', '2025-07-20T15:13:00.000Z', '{"index":0}');

    -- completed goals
    insert into goal(name, type, status, created_at, close_date, render_data)
    values ('Complete S21', 'normal', 'completed', '2025-05-13T14:11:00.000Z',
            '2025-07-19T10:13:00.000Z', '{}');

    -- abandoned goals
    insert into goal(name, type, status, created_at, close_date, render_data)
    values ('Build a VPN service', 'normal', 'abandoned', '2025-06-11T12:18:00.000Z',
            '2025-07-22T15:53:00.000Z', '{}');

    -- other goals
    insert into goal(name, type, status, created_at, render_data)
    values ('Get 100 followers', 'normal', 'active', '2025-07-26T11:17:00.000Z', '{"index":5}');

    -- trackers
    insert into tracker (name, render_data)
    values ('Money', '{"index":0,"size":1}');

    insert into stat_tracker (tracker_id, prefix)
    values (1, '$');

    insert into stat_value (tracker_id, value, created_at)
    values (1, 1000, '2025-05-22T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (1, 2300, '2025-05-20T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (1, 4000, '2025-06-12T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (1, 3100, '2025-06-22T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (1, 5000, '2025-07-04T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (1, 5500, '2025-07-14T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (1, 5000, '2025-07-22T15:53:00.000Z');

    insert into tracker (name, render_data)
    values ('X followers', '{"index":1,"size":1}');

    insert into stat_tracker (tracker_id)
    values (2);

    insert into stat_value (tracker_id, value, created_at)
    values (2, 0, '2025-07-21T15:53:00.000Z');
    insert into stat_value (tracker_id, value, created_at)
    values (2, 3, '2025-08-01T10:16:00.000Z');

    insert into tracker (name, render_data)
    values ('Time till next conscription', '{"index":2,"size":2}');

    insert into date_tracker (tracker_id, date)
    values (3, '2025-10-01T00:00:00.000Z');

    insert into tracker (name, render_data)
    values ('Weight', '{"index":3,"size":1}');


    insert into stat_tracker (tracker_id, suffix)
    values (4, 'kg');

    insert into stat_value (tracker_id, value, created_at)
    values (4, 10, '2025-07-20T16:16:00.000Z');

    -- related trackers
    insert into goal_tracker (goal_id, tracker_id)
    values (4, 2);

    insert into goal_tracker (goal_id, tracker_id)
    values (1, 1);
    
    -- related goals
    insert into goal_relation (goal_id, related_goal_id)
    values (1, 4);
    insert into goal_relation (goal_id, related_goal_id)
    values (1, 6);
    insert into goal_relation (goal_id, related_goal_id)
    values (1, 8);
    insert into goal_relation (goal_id, related_goal_id)
    values (1, 9);
    insert into goal_relation (goal_id, related_goal_id)
    values (1, 10);

    -- prerequisites/consequences
    insert into goal_link (goal_id, next_goal_id)
    values (4, 11);
  `)
}

export async function dropDb(db: SQLiteDatabase) {
  await db.closeAsync()
  await deleteDatabaseAsync('main.db')
}
