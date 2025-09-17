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

    -- prerequisites/consequences - m2m junction table
    create table if not exists goal_link
    (
      goal_id      integer not null references goal (id) on delete cascade,
      next_goal_id integer not null references goal (id) on delete cascade,
      primary key (goal_id, next_goal_id)
    );

    -- related goals, currently unidirectional and only used for longterm goals in a way
    -- that goal_id refers to an LT goal and related_goal_id is a normal related goal
    -- this makes it o2m atm, but it's still modeled as a junction table due to very possible future changes
    create table if not exists goal_relation
    (
      goal_id         integer not null references goal (id) on delete cascade,
      related_goal_id integer not null references goal (id) on delete cascade,
      primary key (goal_id, related_goal_id)
    );

    -- general tracker model - enforces unique names across all tracker types and contains render data
    create table if not exists tracker
    (
      id          integer primary key autoincrement,
      name        text not null unique check (length(name) < 255),
      render_data text not null check (json_valid(render_data))
    );

    -- goal trackers - m2m junction table
    create table if not exists goal_tracker
    (
      goal_id    integer not null references goal (id) on delete cascade,
      tracker_id integer not null references tracker (id) on delete cascade,
      primary key (goal_id, tracker_id)
    );

    create table if not exists date_tracker
    (
      tracker_id integer primary key references tracker (id) on delete cascade,
      date       text not null
    );

    create table if not exists stat_tracker
    (
      tracker_id integer primary key references tracker (id) on delete cascade,
      prefix     text,
      suffix     text
    );


    create table if not exists stat_value
    (
      id         integer primary key autoincrement,
      tracker_id integer not null references tracker (id) on delete cascade,
      value      numeric not null,
      created_at text    not null
    );

    create table if not exists goal_update
    (
      id            integer primary key autoincrement,
      goal_id       integer not null references goal (id) on delete cascade,
      type          text    not null check (type in ('normal', 'status_change')),
      status_change text check (status_change in ('completed', 'abandoned', 'delayed', 'reopened')),
      sentiment     text    not null check (sentiment in ('positive', 'neutral', 'negative')),
      content       text check (length(content) < 10000),
      is_pinned     integer not null check (is_pinned in (0, 1)) default 0,
      created_at    text    not null
    );

    create table if not exists metastat
    (
      id          integer primary key autoincrement,
      name        text not null check (length(name) < 255),
      value       real not null default 0.0,
      level       integer,
      auto_decay  text not null check (auto_decay in ('slow', 'moderate', 'fast')),
      decay_data  text not null check (json_valid(decay_data)),
      render_data text not null check (json_valid(render_data))
    );

    create table if not exists user
    (
      id                               integer primary key autoincrement,
      name                             text    not null check (length(name) < 255),
      is_onboarded                     integer not null check (is_onboarded in (0, 1))                     default 0,
      are_onboarding_tooltips_finished integer not null check (are_onboarding_tooltips_finished in (0, 1)) default 0
    )
  `)
}
