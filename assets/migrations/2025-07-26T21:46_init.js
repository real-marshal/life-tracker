// Migration 2025-07-26T21:46_init.js

module.exports = (db) => {
  return db.execAsync(`
    create table if not exists goal
    (
      id          integer primary key autoincrement,
      name        text not null check (length(name) < 255),
      type        text not null check (type in ('normal', 'longterm')),
      status      text not null check (status in ('active', 'delayed', 'completed', 'abandoned')),
      why         text check (length(why) < 10000),
      created_at  text not null,
      close_date  text,
      render_data text not null check (json_valid(render_data))
    );

    -- prerequisites/consequences
    create table if not exists goal_link
    (
      goal_id      integer not null references goal (id),
      next_goal_id integer not null references goal (id),
      primary key (goal_id, next_goal_id)
    );

    -- related goals, currently only used for longterm goals in a way
    -- that goal_id refers to an LT goal and related_goal_id is a normal related goal
    create table if not exists goal_relation
    (
      goal_id         integer not null references goal (id),
      related_goal_id integer not null references goal (id),
      primary key (goal_id, related_goal_id)
    );

    -- general tracker model - enforces unique names across all tracker types and contains render data
    create table if not exists tracker
    (
      id          integer primary key autoincrement,
      name        text not null unique check (length(name) < 255),
      render_data text not null check (json_valid(render_data))
    );

    create table if not exists goal_tracker
    (
      goal_id    integer not null references goal (id),
      tracker_id integer not null references tracker (id),
      primary key (goal_id, tracker_id)
    );

    create table if not exists date_tracker
    (
      id         integer primary key autoincrement,
      tracker_id integer not null references tracker (id),
      date       text    not null
    );

    create table if not exists stat_tracker
    (
      id         integer primary key autoincrement,
      tracker_id integer not null references tracker (id),
      prefix     text,
      suffix     text
    );


    create table if not exists stat_value
    (
      id              integer primary key autoincrement,
      stat_tracker_id integer not null references stat_tracker (id),
      value           numeric not null,
      created_at      text    not null
    );

    create table if not exists goal_update
    (
      id           integer primary key autoincrement,
      goal_id      integer not null references goal (id),
      type         text    not null check (type in ('normal', 'closing')),
      sentiment    text    not null check (type in ('positive', 'neutral', 'negative')),
      related_goal integer references goal (id),
      content      text    not null check (length(content) < 10000),
      is_pinned    integer not null check (is_pinned in (0, 1)) default 0,
      created_at   text    not null
    );

    create table if not exists metastat
    (
      id         integer primary key autoincrement,
      name       text not null check (length(name) < 255),
      value      real not null default 0.0,
      level      integer,
      decay_data text check (json_valid(decay_data))
    )
  `)
}
