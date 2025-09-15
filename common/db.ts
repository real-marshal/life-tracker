import { deleteDatabaseAsync, SQLiteDatabase } from 'expo-sqlite'
import { markUserAsOnboarded } from '@/models/user'
import { formatISO, subDays } from 'date-fns'

export const dbName = 'main.db'

export async function initSqlite(db: SQLiteDatabase) {
  return db.execAsync('PRAGMA foreign_keys = ON')
}

export async function initUser(db: SQLiteDatabase, name: string) {
  return db.runAsync(
    `
    insert into user(name)
    values ($username)
  `,
    { $username: name }
  )
}

const makeAccumulatingDate = () => {
  let date = new Date()

  return (daysToSub = 0) => {
    date = subDays(date, daysToSub)

    return formatISO(date)
  }
}

const statAccDate = makeAccumulatingDate()

export async function seed(db: SQLiteDatabase) {
  return db.execAsync(`
    -- metastats
    insert into metastat(name, value, level, auto_decay, decay_data, render_data)
    values ('Health', 0.5, 0, 'slow',
            '{"lastValueIncreaseDate": "${formatISO(new Date())}", "lastDecayDate": "${formatISO(new Date())}"}',
            '{}');

    insert into metastat(name, value, level, auto_decay, decay_data, render_data)
    values ('Knowledge', 0.5, 0, 'slow',
            '{"lastValueIncreaseDate": "${formatISO(new Date())}", "lastDecayDate": "${formatISO(new Date())}"}',
            '{}');

    insert into metastat(name, value, auto_decay, decay_data, render_data)
    values ('Mental', 0.5, 'fast',
            '{"lastValueIncreaseDate": "${formatISO(new Date())}", "lastDecayDate": "${formatISO(new Date())}"}',
            '{}');

    -- lt goals
    insert into goal(name, type, status, why, created_at, render_data)
    values ('Move out', 'longterm', 'active', 'Everyone should have their own space...',
            '${formatISO(subDays(new Date(), 10))}', '{}');

    insert into goal(name, type, status, created_at, render_data)
    values ('Buy a car', 'longterm', 'active', '${formatISO(subDays(new Date(), 10))}', '{}');

    insert into goal(name, type, status, why, created_at, render_data)
    values ('Find a partner', 'longterm', 'active', 'I mean...',
            '${formatISO(subDays(new Date(), 10))}', '{}');

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

    ${`
      insert into stat_value (tracker_id, value, created_at)
      values (1, 5000, '${statAccDate()}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 5500, '${statAccDate(8)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 5000, '${statAccDate(10)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 3100, '${statAccDate(12)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 4000, '${statAccDate(10)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 2300, '${statAccDate(22)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 1200, '${statAccDate(2)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 1600, '${statAccDate(30)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 2800, '${statAccDate(30)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 4500, '${statAccDate(7)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 1700, '${statAccDate(53)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 2200, '${statAccDate(101)}');
      insert into stat_value (tracker_id, value, created_at)
      values (1, 3000, '${statAccDate(30)}');
    `
      .trim()
      .split(';')
      .slice(0, -1)
      .toReversed()
      .join(';')
      .concat(';')}

    insert into tracker (name, render_data)
    values ('X followers', '{"index":1,"size":1}');

    insert into stat_tracker (tracker_id)
    values (2);

    insert into stat_value (tracker_id, value, created_at)
    values (2, 0, '${formatISO(subDays(new Date(), 13))}');
    insert into stat_value (tracker_id, value, created_at)
    values (2, 3, '${formatISO(subDays(new Date(), 5))}');

    insert into tracker (name, render_data)
    values ('Time till next conscription', '{"index":2,"size":2}');

    insert into date_tracker (tracker_id, date)
    values (3, '2025-10-01T00:00:00.000Z');

    insert into tracker (name, render_data)
    values ('Weight', '{"index":3,"size":1}');


    insert into stat_tracker (tracker_id, suffix)
    values (4, 'kg');

    insert into stat_value (tracker_id, value, created_at)
    values (4, 10, '${formatISO(subDays(new Date(), 12))}');

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
    insert into goal_relation (goal_id, related_goal_id)
    values (1, 11);

    -- prerequisites/consequences
    insert into goal_link (goal_id, next_goal_id)
    values (4, 12);
    insert into goal_link (goal_id, next_goal_id)
    values (4, 11);
    insert into goal_link (goal_id, next_goal_id)
    values (7, 4);

    -- goal updates
    insert into goal_update (goal_id, type, sentiment, content, created_at)
    values (4, 'normal', 'positive',
            'Created a notion database with some post ideas,  need to add more',
            strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 days', '-14 hours', '-1 minute'));

    insert into goal_update (goal_id, type, sentiment, content, created_at)
    values (4, 'normal', 'positive',
            'Added more ideas, now enough for about 9 months of posting every 2-3 days',
            strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-3 days', '-6 hours', '-42 minutes'));

    insert into goal_update (goal_id, type, sentiment, content, created_at)
    values (4, 'normal', 'negative',
            'Turned out you need ID verification to be able to make money. This makes things much more complicated...',
            strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-3 days', '-4 hours', '-17 minutes'));

    insert into goal_update (goal_id, type, sentiment, content, created_at)
    values (4, 'normal', 'positive', 'Posted second idea',
            strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day', '-3 hours', '-8 minutes'));

    insert into goal_update (goal_id, type, sentiment, content, created_at)
    values (4, 'normal', 'neutral',
            'How much time is actually needed to get somewhere without paying for ads I wonder...',
            strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day', '-1 hour', '-3 minutes'));
  `)
}

export async function dropDb(db: SQLiteDatabase) {
  await db.closeAsync()
  await deleteDatabaseAsync('main.db')
}

export async function initNewDb(
  db: SQLiteDatabase,
  { name, shouldSeed }: { name: string; shouldSeed: boolean }
) {
  shouldSeed && (await seed(db))

  await initUser(db, name)
  await markUserAsOnboarded(db)
}
