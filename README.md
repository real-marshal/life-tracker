# life-tracker

todo:
 - implement knex-like migrations

as to monetization, offer a premium sub that:
- adds sync (use [this lib](https://github.com/kuatsu/react-native-cloud-storage) and just do a full upload regularly, should be fine for now)
- removes the limit of 50 goals in the archive
- gives some intangible benefits that make you feel better: a thank you, some ui changes maybe, a badge etc.

looks like performance benefits of WAL aren't that crazy (6+ times and more) to deal with WAL syncing so i'm not gonna use it here

you can't use any kinds of dynamic import with react native... i mean it's supported but only with fixed asset strings, not variables or imported data. this makes migrations much harder
