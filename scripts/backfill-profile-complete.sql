-- Backfill User.profileComplete for volunteers who appear to have completed the survey
-- Adjust the WHERE clause if your definition differs.

update "User" u
set "profileComplete" = true
where u.id in (
  select v."userId"
  from "Volunteer" v
  where v."firstName" is not null
    and v."lastName" is not null
    and v."weeklyGoalHours" is not null
);
