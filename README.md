# life-tracker

tips:
 - use `yarn sync-device-db` to have a fresh copy of the device db locally (android only)
 - use `yarn make-migration` to create a new migration - it'll be automatically applied on device on app launch. if you need to rollback, create a new migration.

todo:
 - implement knex-like migrations - done
 - handle sorting and user saved sort order
 - windowsify migration names (: is not supported...) - low priority
 - decide on trackers' size rendering
 - global search
 - delayed until time?
 - optimize HistoricalData (it feels very bad atm)
 - virtualize goal and goal update lists

as to monetization, offer a premium sub that:
- adds sync (use [this lib](https://github.com/kuatsu/react-native-cloud-storage) and just do a full upload regularly, should be fine for now)
- removes the limit of 50 goals in the archive
- gives some intangible benefits that make you feel better: a thank you, some ui changes maybe, a badge etc.

looks like performance benefits of WAL aren't that crazy (6+ times and more) to deal with WAL syncing so i'm not gonna use it here

---

you can't use any kinds of dynamic import with react native... i mean it's supported but only with fixed asset strings, not variables or imported data. this makes migrations much harder

turned out i was using require.context incorrectly...

---

using nativewind might've been a mistake...

---

regarding grid animation lag https://github.com/FormidableLabs/victory-native-xl/issues/538

the problem with broken gestures outside viewport https://github.com/FormidableLabs/victory-native-xl/issues/515 :

my fork solves the problems above, read my comments in those threads for more explanations.

---

nativewind was definitely a mistake... i mean it's nice but that active: modifier breaks too often in complex scenarios, shoulda perhaps used that other rn tailwind library that just translates tw class names to style objects without trying to offer all this smart, barely working shit via babel transforms

---

RNGH docs say that their Pressable is a drop-in replacement for RN Pressable, yet somehow when I changed the imports, turned out their Pressable doesn't use the passed style...

hmm, nah, that's another nativewind moment I'm pretty sure, className isn't passed or interpreted the same by their babel... damn, never use it again

still it's so annoying that I used both Pressables in different places, because they seem to be incompatible, sometimes one works, sometimes the other...

yep, the more I use it, the more I see the differences, their styling is completely different... insanity
