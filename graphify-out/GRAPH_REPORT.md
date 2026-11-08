# Graph Report - Neighborhood_Heroes  (2026-11-08)

## Corpus Check
- 130 files · ~549,496 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .csv 3, .vdf 1)

## Summary
- 1598 nodes · 5719 edges · 67 communities (56 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9f9a1ec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data/world.js
- League, Matches & Rivalries
- Locations & Scenes
- game.js
- World Builder & Props
- Furniture & Objects
- h
- Team Stats & Grades
- Fields & Arenas
- Jobs & Economy
- Web Deploy Workflow
- Game Loop & Achievements
- Build Scripts & Browser Tests
- 3D Engine & Rendering
- Clock, Days & Season
- Engine, Camera & Characters
- Friendships & Dialogue
- Character Style & Palette
- seasons.js
- 3D Geometry Shapes
- Character Sprites
- Character Drawing
- Kid Generator Tools
- league.test.mjs
- 2D Projection
- $
- Classroom & Notes
- Desktop Build Workflow
- Character Art Prompts
- Daily Routines
- 3D Materials
- Match Simulation
- sfx
- Match Play-by-Play
- School & Quizzes
- game/team.js
- Phone Home Screen
- npm Scripts
- steps
- Desktop Packaging Config
- state.js
- Dev Dependencies
- houses.js
- time.js
- Logo
- Canvas Textures
- Vector Math
- Package Info & Steam
- Electron Desktop Shell
- Movement & Input Loop
- 3D Object Tree
- turning.js
- Dev Scene Viewer
- Colors
- Surface Patterns
- BufferAttribute
- Euler
- BufferGeometry
- @eslint/js
- jerseyPreview
- paint.js
- InstancedMesh
- .prettierrc.json
- Quaternion
- Shape
- manifest.json
- CanvasTexture

## God Nodes (most connected - your core abstractions)
1. `h()` - 93 edges
2. `dayInfo()` - 80 edges
3. `$` - 69 edges
4. `sfx()` - 67 edges
5. `toast()` - 64 edges
6. `modal()` - 64 edges
7. `btn()` - 49 edges
8. `mulberry32()` - 41 edges
9. `Game` - 41 edges
10. `kidGrade()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `kidDetail()` --calls--> `lookSpec()`  [EXTRACTED]
  src/ui/phone/team.js → art/charstyle/figure.js
- `kidDetail()` --calls--> `renderCharacter()`  [EXTRACTED]
  src/ui/phone/team.js → art/charstyle/figure.js
- `frameImage()` --calls--> `renderCharacter()`  [EXTRACTED]
  src/world2d/sprites.js → art/charstyle/figure.js
- `specForLook()` --calls--> `adultSpec()`  [EXTRACTED]
  src/world2d/sprites.js → art/charstyle/adults.js
- `specForLook()` --calls--> `kidSpec()`  [EXTRACTED]
  src/world2d/sprites.js → art/charstyle/figure.js

## Import Cycles
- 2-file cycle: `src/ui/game.js -> src/ui/match.js -> src/ui/game.js`
- 2-file cycle: `src/ui/game.js -> src/ui/game/schoolday.js -> src/ui/game.js`
- 2-file cycle: `src/world2d/engine.js -> src/world2d/engine/render.js -> src/world2d/engine.js`
- 2-file cycle: `src/world2d/engine.js -> src/world2d/engine/world.js -> src/world2d/engine.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/contacts.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/social.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/contacts.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/contacts.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/social.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/training.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/social.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/social.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/settings.js -> src/ui/phone/social.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`

## Communities (67 total, 11 thin omitted)

### Community 0 - "data/world.js"
Cohesion: 0.09
Nodes (36): ADULTS, classFor(), DRILLS, FIELDS, PAIR_A, PAIR_B, PLAYER_TRAIN_CAP, RIVAL_COLORS (+28 more)

### Community 1 - "League, Matches & Rivalries"
Cohesion: 0.07
Nodes (71): PRIZES, aiRecruit(), announcerTier(), busted(), endSeason(), EXTRA_JR_TEAMS, forfeitResult(), forfeitScore() (+63 more)

### Community 2 - "Locations & Scenes"
Cohesion: 0.22
Nodes (33): hashString(), buildLocation(), specFor(), TORUS, finishArea(), makeArea(), wallPicture(), adultLook() (+25 more)

### Community 3 - "game.js"
Cohesion: 0.22
Nodes (15): roomNumber(), ACHIEVEMENTS, checkAchievements(), currentPeriod(), playerClass(), nextClassBlock(), schoolBlockAt(), exitClass() (+7 more)

### Community 4 - "World Builder & Props"
Cohesion: 0.05
Nodes (26): BOX, CAPSULE, CONE, CYL, CYL6, EYES, HAIR, HAIR_ACCENT (+18 more)

### Community 5 - "Furniture & Objects"
Cohesion: 0.09
Nodes (40): shade(), armchair(), beanbag(), bulletinBoard(), chair(), computerDesk(), _eu, fileCabinet() (+32 more)

### Community 6 - "h"
Cohesion: 0.24
Nodes (23): KID_BY_ID, shortName(), sharedClasses(), callCheck(), friendshipLabel(), hasNumber(), btn(), h() (+15 more)

### Community 7 - "Team Stats & Grades"
Cohesion: 0.13
Nodes (34): KIDS_META, POSITIONS, STAT_CODES, newSchoolYear(), matchSide(), teamOverall(), getKid(), playerKid() (+26 more)

### Community 8 - "Fields & Arenas"
Cohesion: 0.13
Nodes (35): addPickups(), startMowing(), startPaperRoute(), buildArena(), canopy(), crowd(), lightTower(), MAXED (+27 more)

### Community 9 - "Jobs & Economy"
Cohesion: 0.10
Nodes (40): GENERIC, LINES, PARENT_LINES, SNITCH_LINES, ITEMS, JOBS, ASK_BIG_MAX, ASK_MAX (+32 more)

### Community 10 - "Web Deploy Workflow"
Cohesion: 0.05
Nodes (39): env, outputs, runs-on, steps, concurrency, cancel-in-progress, group, environment (+31 more)

### Community 11 - "Game Loop & Achievements"
Cohesion: 0.08
Nodes (10): collectPickup(), markAbsent(), markTardy(), resumeClass(), closeTopModal(), modalOpen(), Game, addAdults() (+2 more)

### Community 12 - "Build Scripts & Browser Tests"
Cohesion: 0.07
Nodes (20): H, list, m, root, W, zip, dev, fontCss() (+12 more)

### Community 13 - "3D Engine & Rendering"
Cohesion: 0.13
Nodes (34): compileNode(), facePath(), forCells(), GRID, INK, nameplateCanvas(), push(), coversItem() (+26 more)

### Community 14 - "Clock, Days & Season"
Cohesion: 0.20
Nodes (25): advance(), GAME_TIME, nextGameInfo(), restartSeasonLeague(), skipDay(), skipToNextGame(), skipToNextYear(), sleep() (+17 more)

### Community 15 - "Engine, Camera & Characters"
Cohesion: 0.08
Nodes (4): Engine, bindInput(), mulberry(), buildCharacter()

### Community 16 - "Friendships & Dialogue"
Cohesion: 0.13
Nodes (42): kidName(), acceptRinger(), declineRinger(), describeSlot(), routineSlots(), acceptFavor(), ACTIVITIES, addFriendship() (+34 more)

### Community 17 - "Character Style & Palette"
Cohesion: 0.09
Nodes (27): BUILDS, AVG_IN, BAND_HEADS, BAND_SHOULDER, BUILD, DIGITS, EMBLEM_BY_LIKE, FACE_BY_PERSONALITY (+19 more)

### Community 18 - "seasons.js"
Cohesion: 0.33
Nodes (14): SPORTS, applySignup(), chooseNextSport(), LATE_SIGNUP_WEEK, likelyRecruits(), nextSeasonInfo(), seasonEntry(), signupOpen() (+6 more)

### Community 19 - "3D Geometry Shapes"
Cohesion: 0.06
Nodes (12): BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Geo, IcosahedronGeometry, LatheGeometry, OctahedronGeometry (+4 more)

### Community 20 - "Character Sprites"
Cohesion: 0.11
Nodes (19): ADULT_CAST, adultSpec(), manifest, root, BAND(), kidSpec(), lookSpec(), pick() (+11 more)

### Community 21 - "Character Drawing"
Cohesion: 0.19
Nodes (28): browsSvg(), emblemSvg(), faceSvg(), garment(), headAccessories(), mittenHand(), patternSvg(), quadAt() (+20 more)

### Community 22 - "Kid Generator Tools"
Cohesion: 0.13
Nodes (11): background_model(), cut(), main(), trim(), build_kid(), clamp(), letter(), main() (+3 more)

### Community 23 - "league.test.mjs"
Cohesion: 0.19
Nodes (13): KIDS, SPORT_IDS, doChore(), PITCH_ROUNDS, serialize(), kidStats(), LETTERS, sportStatImportance() (+5 more)

### Community 24 - "2D Projection"
Cohesion: 0.18
Nodes (24): apply(), bboxOf(), colCache, cross(), dot(), faceColor(), finishItem(), geoMatrix() (+16 more)

### Community 25 - "$"
Cohesion: 0.05
Nodes (89): PERKS, PLAYER_BASE_STAT, STAT_MAX, STAT_POINTS, applyKnowledge(), better(), knowledgeOn(), knowledgeSummary() (+81 more)

### Community 26 - "Classroom & Notes"
Cohesion: 0.20
Nodes (25): knowsName(), addPrep(), COLS, neighborsOf(), noteBusted(), passNote(), pathBetween(), requestSeatSwap() (+17 more)

### Community 27 - "Desktop Build Workflow"
Cohesion: 0.08
Nodes (23): CSC_IDENTITY_AUTO_DISCOVERY, jobs, package, os, name, on, push, workflow_dispatch (+15 more)

### Community 28 - "Character Art Prompts"
Cohesion: 0.14
Nodes (17): accText(), ADULT_SHOES, bottomText(), BROW, col(), COLOR, describe(), EMBLEM (+9 more)

### Community 29 - "Daily Routines"
Cohesion: 0.23
Nodes (17): HOOD_BY_NAME, parseSpot(), PLAYER_LUNCH, RECESS_ZONES, atHilltop(), evening(), kidClass(), kidHood() (+9 more)

### Community 30 - "3D Materials"
Cohesion: 0.13
Nodes (13): ClampToEdgeWrapping, DoubleSide, LinearMipmapLinearFilter, Mat, Matrix4, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial (+5 more)

### Community 31 - "Match Simulation"
Cohesion: 0.30
Nodes (20): rivalCount(), clamp(), advanceHit(), avg(), baseball(), basketball(), byPos(), decide() (+12 more)

### Community 32 - "sfx"
Cohesion: 0.19
Nodes (18): quizHints(), quizSeconds(), sfx(), runQuiz(), modal(), caughtInHall(), checkHangouts(), claw() (+10 more)

### Community 33 - "Match Play-by-Play"
Cohesion: 0.35
Nodes (18): baseballPlay(), basketballPlay(), COURT, courtSpot(), dirOf(), footballPlay(), nidOf(), other() (+10 more)

### Community 34 - "School & Quizzes"
Cohesion: 0.14
Nodes (26): READING, SCIENCE, SOCIAL, SPELLING, askParents(), mowJobs(), roundRobin(), pick() (+18 more)

### Community 35 - "game/team.js"
Cohesion: 0.16
Nodes (33): recruitState(), attraction(), buyGear(), concessionTier(), demand(), facilityScore(), FIELD_BONUS, FIELD_DRAW (+25 more)

### Community 36 - "Phone Home Screen"
Cohesion: 0.12
Nodes (23): LOCATIONS, NEIGHBORHOODS, isGroundedHome(), appGlyph(), BG, GLYPHS, iconBackground(), handle (+15 more)

### Community 37 - "npm Scripts"
Cohesion: 0.12
Nodes (16): scripts, art, art:png, art:prompts, build, data, dev, dist (+8 more)

### Community 38 - "steps"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GRAPHIFY_BACKEND, GRAPHIFY_FORCE, runs-on, steps, jobs (+15 more)

### Community 39 - "Desktop Packaging Config"
Cohesion: 0.13
Nodes (15): build, appId, asarUnpack, directories, files, linux, mac, productName (+7 more)

### Community 40 - "state.js"
Cohesion: 0.17
Nodes (21): GEAR, GEAR_IDS, UPGRADE_IDS, gearBoost(), heightOf(), kidGrade(), playerGrade(), SAVE_KEY (+13 more)

### Community 41 - "Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, electron-builder@25.1.8, esbuild@0.24.2, eslint@9.14.0, @fontsource/lilita-one@^5.2.5, @fontsource/nunito@^5.2.5, http-server@14.1.1, prettier@3.4.2 (+7 more)

### Community 42 - "houses.js"
Cohesion: 0.48
Nodes (6): GABLE, apartment(), apartmentShape(), house(), houseShape(), windowOn()

### Community 43 - "time.js"
Cohesion: 0.13
Nodes (22): CORE_SUBJECTS, SCHOOL_BLOCKS, weatherFor(), askPrincipal(), letterFor(), weeklyGradeCheck(), gradeAverage(), CURFEW (+14 more)

### Community 44 - "Logo"
Cohesion: 0.35
Nodes (13): ARC, arcAngle(), arcPt(), arcText(), buildLogo(), burst(), defs(), el() (+5 more)

### Community 45 - "Canvas Textures"
Cohesion: 0.24
Nodes (15): mulberry32(), classroom(), LOCKER_BLUE, cache, canvas(), chainTexture(), chalkboardTexture(), finish() (+7 more)

### Community 47 - "Package Info & Steam"
Cohesion: 0.17
Nodes (12): author, description, license, main, name, optionalDependencies, steamworks.js@0.4.0, private (+4 more)

### Community 48 - "Electron Desktop Shell"
Cohesion: 0.17
Nodes (6): { app, BrowserWindow, ipcMain, Menu }, fs, path, { contextBridge, ipcRenderer }, electron@33.4.11, electron

### Community 49 - "Movement & Input Loop"
Cohesion: 0.27
Nodes (7): autoWalkStep(), faceAndTalk(), setFocus(), updateFocus(), collide(), updateNPCs(), updatePlayer()

### Community 50 - "3D Object Tree"
Cohesion: 0.17
Nodes (4): Custom2D, Group, Object3D, Sprite

### Community 52 - "Dev Scene Viewer"
Cohesion: 0.20
Nodes (9): div, eng, nk, off, q, sx, sz, tier (+1 more)

### Community 55 - "Surface Patterns"
Cohesion: 0.25
Nodes (6): cache, DEFS, PATTERNED, patternFor(), drawItem(), pathOf()

### Community 60 - "@eslint/js"
Cohesion: 0.40
Nodes (4): @eslint/js@9.14.0, globals@15.12.0, @eslint/js, globals

### Community 61 - "jerseyPreview"
Cohesion: 0.80
Nodes (4): jerseyPreview(), light(), shade(), shirt()

### Community 62 - "paint.js"
Cohesion: 0.60
Nodes (4): blobPath(), hexMix(), LEAF, paintItem()

### Community 64 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `esbuild` connect `Dev Dependencies` to `Build Scripts & Browser Tests`, `Package Info & Steam`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `data/world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._
- **Why does `Engine` connect `Engine, Camera & Characters` to `World Builder & Props`, `3D Engine & Rendering`, `Movement & Input Loop`, `Dev Scene Viewer`, `2D Projection`, `$`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `League, Matches & Rivalries` be split into smaller, more focused modules?**
  _Cohesion score 0.06859806859806859 - nodes in this community are weakly interconnected._
- **Why does `KIDS` connect `league.test.mjs` to `data/world.js`, `League, Matches & Rivalries`, `School & Quizzes`, `game.js`, `Locations & Scenes`, `Phone Home Screen`, `h`, `state.js`, `Jobs & Economy`, `Friendships & Dialogue`, `seasons.js`, `Character Sprites`, `Dev Scene Viewer`, `Character Art Prompts`, `Daily Routines`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `World Builder & Props` be split into smaller, more focused modules?**
  _Cohesion score 0.04716981132075472 - nodes in this community are weakly interconnected._
- **Should `Furniture & Objects` be split into smaller, more focused modules?**
  _Cohesion score 0.08973172987974098 - nodes in this community are weakly interconnected._