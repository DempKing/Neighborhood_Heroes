// Which function draws each app.
import { contactsTab } from './contacts.js';
import { fieldTab } from './field.js';
import { leagueApp } from './league.js';
import { backpackApp, bankApp, callsApp, diaryApp } from './money.js';
import { schoolApp } from './school.js';
import { settingsTab } from './settings.js';
import { socialApp } from './social.js';
import { teamTab } from './team.js';
import { trainingTab } from './training.js';

/** The function that draws each app. */
export const APP_FNS = {
  team: teamTab,
  training: trainingTab,
  contacts: contactsTab,
  social: socialApp,
  calls: callsApp,
  field: fieldTab,
  league: leagueApp,
  school: schoolApp,
  bank: bankApp,
  backpack: backpackApp,
  diary: diaryApp,
  settings: settingsTab,
};
