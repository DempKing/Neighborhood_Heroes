# Graph Report - neighborhood_heroes  (2026-11-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1574 nodes · 5696 edges · 69 communities (58 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a54307e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Team, Training & Field
- League, Matches & Rivalries
- Locations & Scenes
- Game Screen & Map
- World Builder & Props
- Furniture & Objects
- Talk, Social & Money Apps
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
- Calendar, Seasons & Signup
- 3D Geometry Shapes
- Character Sprites
- Character Drawing
- Kid Generator Tools
- Game State & Tests
- 2D Projection
- Character Creator
- Classroom & Notes
- Desktop Build Workflow
- Character Art Prompts
- Daily Routines
- 3D Materials
- Match Simulation
- Tryouts & Minigames
- Match Play-by-Play
- School & Quizzes
- Knowledge System
- Phone Home Screen
- npm Scripts
- Music & Sound
- Desktop Packaging Config
- Input & Touch
- Dev Dependencies
- School Seating & Parents
- Grades & School App
- Logo
- Canvas Textures
- Vector Math
- Package Info & Steam
- Electron Desktop Shell
- Movement & Input Loop
- 3D Object Tree
- Title & Save Slots
- Dev Scene Viewer
- Colors
- Phone Settings
- Surface Patterns
- Nature Props
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
8. `Game` - 41 edges
9. `mulberry32()` - 41 edges
10. `kidGrade()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `kidDetail()` --calls--> `lookSpec()`  [EXTRACTED]
  src/ui/phone/team.js → art/charstyle/figure.js
- `frameImage()` --calls--> `renderCharacter()`  [EXTRACTED]
  src/world2d/sprites.js → art/charstyle/figure.js
- `kidDetail()` --calls--> `renderCharacter()`  [EXTRACTED]
  src/ui/phone/team.js → art/charstyle/figure.js
- `lineupRating()` --calls--> `statsOf()`  [EXTRACTED]
  src/game/team.js → src/game/state.js
- `venue()` --calls--> `buildVenue()`  [EXTRACTED]
  src/main.js → src/world2d/scenes/venues.js

## Import Cycles
- 2-file cycle: `src/world2d/engine.js -> src/world2d/engine/render.js -> src/world2d/engine.js`
- 2-file cycle: `src/world2d/engine.js -> src/world2d/engine/world.js -> src/world2d/engine.js`
- 2-file cycle: `src/ui/game.js -> src/ui/match.js -> src/ui/game.js`
- 2-file cycle: `src/ui/game.js -> src/ui/game/schoolday.js -> src/ui/game.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/contacts.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/social.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 4-file cycle: `src/ui/phone.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/contacts.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/contacts.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/training.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/social.js -> src/ui/phone/team.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/social.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/settings.js -> src/ui/phone/social.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/social.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`
- 5-file cycle: `src/ui/phone.js -> src/ui/phone/registry.js -> src/ui/phone/money.js -> src/ui/talk.js -> src/ui/places.js -> src/ui/phone.js`

## Communities (69 total, 11 thin omitted)

### Community 0 - "Team, Training & Field"
Cohesion: 0.07
Nodes (69): ADULTS, DRILLS, FIELDS, GEAR, GEAR_IDS, PAIR_A, PAIR_B, PLAYER_TRAIN_CAP (+61 more)

### Community 1 - "League, Matches & Rivalries"
Cohesion: 0.08
Nodes (64): KID_BY_ID, announcerTier(), endSeason(), EXTRA_JR_TEAMS, forfeitResult(), forfeitScore(), gameSeed(), kitBottoms() (+56 more)

### Community 2 - "Locations & Scenes"
Cohesion: 0.18
Nodes (42): hashString(), mulberry32(), addAdults(), addPickups(), buildLocation(), specFor(), PRISM, TORUS (+34 more)

### Community 3 - "Game Screen & Map"
Cohesion: 0.11
Nodes (36): LOCATIONS, roomNumber(), currentPeriod(), isGroundedHome(), missHangout(), formatTime(), nextClassBlock(), schoolBlockAt() (+28 more)

### Community 4 - "World Builder & Props"
Cohesion: 0.06
Nodes (26): BOX, CAPSULE, CONE, CYL, CYL6, GABLE, HAIR_ACCENT, HALF_TORUS (+18 more)

### Community 5 - "Furniture & Objects"
Cohesion: 0.09
Nodes (40): shade(), armchair(), beanbag(), bulletinBoard(), chair(), computerDesk(), _eu, fileCabinet() (+32 more)

### Community 6 - "Talk, Social & Money Apps"
Cohesion: 0.15
Nodes (39): kidName(), knowsName(), declineRinger(), sharedClasses(), callCheck(), chatTopics(), completeFavor(), friendshipLabel() (+31 more)

### Community 7 - "Team Stats & Grades"
Cohesion: 0.12
Nodes (43): KIDS_META, shortName(), POSITIONS, SPORTS, newSchoolYear(), aiRecruit(), busted(), ringerCandidate() (+35 more)

### Community 8 - "Fields & Arenas"
Cohesion: 0.14
Nodes (32): buildArena(), canopy(), crowd(), lightTower(), MAXED, resample(), ribbon(), roundedRect() (+24 more)

### Community 9 - "Jobs & Economy"
Cohesion: 0.11
Nodes (40): ITEMS, JOBS, ASK_BIG_MAX, ASK_MAX, ASK_REASON_MIN, askQuestions(), buy(), CHORES (+32 more)

### Community 10 - "Web Deploy Workflow"
Cohesion: 0.05
Nodes (39): env, outputs, runs-on, steps, concurrency, cancel-in-progress, group, environment (+31 more)

### Community 11 - "Game Loop & Achievements"
Cohesion: 0.10
Nodes (9): checkAchievements(), markAbsent(), exitClass(), toast(), Game, showArrival(), tagFor(), handleSpot() (+1 more)

### Community 12 - "Build Scripts & Browser Tests"
Cohesion: 0.07
Nodes (21): H, list, m, root, W, zip, esbuild, dev (+13 more)

### Community 13 - "3D Engine & Rendering"
Cohesion: 0.13
Nodes (34): compileNode(), facePath(), forCells(), GRID, INK, nameplateCanvas(), push(), coversItem() (+26 more)

### Community 14 - "Clock, Days & Season"
Cohesion: 0.15
Nodes (32): advance(), finishPractice(), GAME_TIME, nextGameInfo(), skipDay(), skipToNextGame(), skipToNextYear(), sleep() (+24 more)

### Community 15 - "Engine, Camera & Characters"
Cohesion: 0.08
Nodes (4): Engine, bindInput(), mulberry(), buildCharacter()

### Community 16 - "Friendships & Dialogue"
Cohesion: 0.11
Nodes (32): GENERIC, LINES, PARENT_LINES, SNITCH_LINES, describeSlot(), routineSlots(), acceptFavor(), ACTIVITIES (+24 more)

### Community 17 - "Character Style & Palette"
Cohesion: 0.09
Nodes (27): BUILDS, AVG_IN, BAND_HEADS, BAND_SHOULDER, BUILD, DIGITS, EMBLEM_BY_LIKE, FACE_BY_PERSONALITY (+19 more)

### Community 18 - "Calendar, Seasons & Signup"
Cohesion: 0.13
Nodes (27): SCHOOL_BLOCKS, restartSeasonLeague(), chooseNextSport(), LATE_SIGNUP_WEEK, likelyRecruits(), nextSeasonInfo(), seasonEntry(), signupOpen() (+19 more)

### Community 19 - "3D Geometry Shapes"
Cohesion: 0.06
Nodes (12): BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Geo, IcosahedronGeometry, LatheGeometry, OctahedronGeometry (+4 more)

### Community 20 - "Character Sprites"
Cohesion: 0.11
Nodes (20): ADULT_CAST, adultSpec(), manifest, root, BAND(), kidSpec(), lookSpec(), pick() (+12 more)

### Community 21 - "Character Drawing"
Cohesion: 0.19
Nodes (28): browsSvg(), emblemSvg(), faceSvg(), garment(), headAccessories(), mittenHand(), patternSvg(), quadAt() (+20 more)

### Community 22 - "Kid Generator Tools"
Cohesion: 0.13
Nodes (11): background_model(), cut(), main(), trim(), build_kid(), clamp(), letter(), main() (+3 more)

### Community 23 - "Game State & Tests"
Cohesion: 0.19
Nodes (16): KIDS, SPORT_IDS, ACHIEVEMENTS, deleteSlot(), deserialize(), gearBoost(), loadSlot(), newGame() (+8 more)

### Community 24 - "2D Projection"
Cohesion: 0.18
Nodes (24): apply(), bboxOf(), colCache, cross(), dot(), faceColor(), finishItem(), geoMatrix() (+16 more)

### Community 25 - "Character Creator"
Cohesion: 0.10
Nodes (23): NEIGHBORHOODS, PERKS, PLAYER_BASE_STAT, STAT_MAX, STAT_POINTS, ACCESSORIES, ADJ, BUILDS (+15 more)

### Community 26 - "Classroom & Notes"
Cohesion: 0.16
Nodes (24): TEACHERS, addPrep(), COLS, neighborsOf(), noteBusted(), passNote(), pathBetween(), ROWS (+16 more)

### Community 27 - "Desktop Build Workflow"
Cohesion: 0.08
Nodes (23): CSC_IDENTITY_AUTO_DISCOVERY, jobs, package, os, name, on, push, workflow_dispatch (+15 more)

### Community 28 - "Character Art Prompts"
Cohesion: 0.14
Nodes (17): accText(), ADULT_SHOES, bottomText(), BROW, col(), COLOR, describe(), EMBLEM (+9 more)

### Community 29 - "Daily Routines"
Cohesion: 0.21
Nodes (19): classFor(), HOOD_BY_NAME, parseSpot(), PLAYER_LUNCH, RECESS_ZONES, atHilltop(), evening(), kidClass() (+11 more)

### Community 30 - "3D Materials"
Cohesion: 0.13
Nodes (13): ClampToEdgeWrapping, DoubleSide, LinearMipmapLinearFilter, Mat, Matrix4, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial (+5 more)

### Community 31 - "Match Simulation"
Cohesion: 0.33
Nodes (18): advanceHit(), avg(), baseball(), basketball(), byPos(), decide(), football(), ghost (+10 more)

### Community 32 - "Tryouts & Minigames"
Cohesion: 0.24
Nodes (17): MAX_ROSTER, sprintTime(), sfx(), modal(), onDismissal(), claw(), playKidGame(), quiz() (+9 more)

### Community 33 - "Match Play-by-Play"
Cohesion: 0.35
Nodes (18): baseballPlay(), basketballPlay(), COURT, courtSpot(), dirOf(), footballPlay(), nidOf(), other() (+10 more)

### Community 34 - "School & Quizzes"
Cohesion: 0.20
Nodes (15): READING, SCIENCE, SOCIAL, SPELLING, mowJobs(), pick(), randInt(), applyPunishment() (+7 more)

### Community 35 - "Knowledge System"
Cohesion: 0.19
Nodes (14): applyKnowledge(), better(), knowledgeOn(), knowledgeSummary(), knownOf(), setKnowledgeOn(), loadSettings(), saveNow() (+6 more)

### Community 36 - "Phone Home Screen"
Cohesion: 0.18
Nodes (13): appGlyph(), BG, GLYPHS, iconBackground(), handle, ALIASES, APP_BY_ID, APPS (+5 more)

### Community 37 - "npm Scripts"
Cohesion: 0.12
Nodes (16): scripts, art, art:png, art:prompts, build, data, dev, dist (+8 more)

### Community 38 - "Music & Sound"
Cohesion: 0.26
Nodes (15): ac(), crowdCheer(), crowdLevel(), duckMusic(), noise(), NOTE(), padNote(), pluck() (+7 more)

### Community 39 - "Desktop Packaging Config"
Cohesion: 0.13
Nodes (15): build, appId, asarUnpack, directories, files, linux, mac, productName (+7 more)

### Community 40 - "Input & Touch"
Cohesion: 0.30
Nodes (13): applyTouchPref(), candidates(), center(), coarse(), key(), listeners, navScope(), readPref() (+5 more)

### Community 41 - "Dev Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, electron-builder@25.1.8, esbuild@0.24.2, eslint@9.14.0, @fontsource/lilita-one@^5.2.5, @fontsource/nunito@^5.2.5, http-server@14.1.1, prettier@3.4.2 (+6 more)

### Community 42 - "School Seating & Parents"
Cohesion: 0.22
Nodes (12): CORE_SUBJECTS, askChance(), askParents(), generosityLimit(), roundRobin(), seeded(), shuffle(), dareOffer() (+4 more)

### Community 43 - "Grades & School App"
Cohesion: 0.23
Nodes (13): askPrincipal(), letterFor(), playerClass(), playerSection(), quizHints(), quizSeconds(), recordQuiz(), requestSeatSwap() (+5 more)

### Community 44 - "Logo"
Cohesion: 0.35
Nodes (13): ARC, arcAngle(), arcPt(), arcText(), buildLogo(), burst(), defs(), el() (+5 more)

### Community 45 - "Canvas Textures"
Cohesion: 0.25
Nodes (11): cache, canvas(), chainTexture(), chalkboardTexture(), finish(), netTexture(), PAINTERS, softDot() (+3 more)

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

### Community 51 - "Title & Save Slots"
Cohesion: 0.49
Nodes (10): freeSlot(), listSlots(), loadFromStorage(), loadScreen(), showTitle(), slotPicker(), slotSummary(), stopTitleBackdrop() (+2 more)

### Community 52 - "Dev Scene Viewer"
Cohesion: 0.20
Nodes (9): div, eng, nk, off, q, sx, sz, tier (+1 more)

### Community 54 - "Phone Settings"
Cohesion: 0.46
Nodes (7): getMusicVolume(), getVolume(), setMusicVolume(), setVolume(), setTouchPref(), touchPref(), settingsTab()

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

- **Why does `esbuild` connect `Build Scripts & Browser Tests` to `Dev Dependencies`, `Package Info & Steam`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `Team, Training & Field` be split into smaller, more focused modules?**
  _Cohesion score 0.06960385042576823 - nodes in this community are weakly interconnected._
- **Why does `KIDS` connect `Game State & Tests` to `League, Matches & Rivalries`, `School & Quizzes`, `Game Screen & Map`, `Locations & Scenes`, `Phone Home Screen`, `Talk, Social & Money Apps`, `Jobs & Economy`, `School Seating & Parents`, `Friendships & Dialogue`, `Calendar, Seasons & Signup`, `Character Sprites`, `Dev Scene Viewer`, `Character Art Prompts`, `Daily Routines`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `League, Matches & Rivalries` be split into smaller, more focused modules?**
  _Cohesion score 0.07967806841046278 - nodes in this community are weakly interconnected._
- **Why does `Geo` connect `3D Geometry Shapes` to `BufferGeometry`, `3D Materials`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `Game Screen & Map` be split into smaller, more focused modules?**
  _Cohesion score 0.10693877551020409 - nodes in this community are weakly interconnected._
- **Should `World Builder & Props` be split into smaller, more focused modules?**
  _Cohesion score 0.057624113475177305 - nodes in this community are weakly interconnected._