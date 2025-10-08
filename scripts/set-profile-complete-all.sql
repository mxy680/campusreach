-- Set profileComplete = true for all users
update "User"
set "profileComplete" = true
where "profileComplete" = false;
