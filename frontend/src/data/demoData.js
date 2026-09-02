/**
 * demoData.js — Centralized demo data for FootPrintX Demo Mode.
 *
 * All demo data is static and self-contained. No API calls are made.
 * Components in demo mode consume this data directly instead of calling
 * the real ApiService.
 */

// ---------------------------------------------------------------------------
// Demo User
// ---------------------------------------------------------------------------
export const demoUser = {
  name: 'Alex Morgan',
  email: 'alex.morgan.demo@gmail.com',
  avatar: `https://ui-avatars.com/api/?name=Alex+Morgan&background=4F46E5&color=fff&size=128`,
};

// ---------------------------------------------------------------------------
// Digital Risk Score & Dimensions
// ---------------------------------------------------------------------------
// overall = average of all dims; dims follow the same names used by computeRisk()
export const demoRiskScore = {
  overall: 68,
  label: 'Moderate',
  dims: {
    Email:    72,
    Storage:  58,
    Privacy:  75,
    Websites: 63,
    Images:   70,
  },
  factors: [
    { text: 'Spam makes up 14% of your inbox',                           severity: 'high',   route: '/demo/email-manager'    },
    { text: '32% of Drive files are unused/decayed',                     severity: 'high',   route: '/demo/drive-cleanup'    },
    { text: '47 active email subscriptions expose your address widely',  severity: 'medium', route: '/demo/email-manager'    },
    { text: '38% of tracked websites are inactive — old accounts',       severity: 'medium', route: '/demo/website-tracker'  },
    { text: '18 archive files — review for old zips',                    severity: 'low',    route: '/demo/drive-classifier' },
    { text: '24 duplicate images wasting storage',                       severity: 'medium', route: '/demo/drive-cleanup'    },
  ],
};

// ---------------------------------------------------------------------------
// Breach Radar / Privacy & Security Radar
// ---------------------------------------------------------------------------
export const demoBreachData = {
  score: 68,
  level: 'Moderate',
  summary:
    'Your digital footprint has moderate exposure. A few shared files and inactive accounts are your primary risk areas.',
  statistics: {
    totalFiles:      1247,
    sharedFiles:     84,
    publicFiles:     12,
    sensitiveShared: 7,
    dormantAccounts: 11,
    largeSharedFiles: 19,
    oldSharedFiles:  31,
    trackedWebsites: 142,
    criticalAlerts:  1,
    highAlerts:      3,
  },
  alerts: [
    {
      id: 'a1',
      severity: 'critical',
      title: 'Sensitive file shared publicly',
      description: 'Internship_Documents.pdf is shared with anyone who has the link and contains personal information.',
      recommendation: 'Revoke public access and change sharing to specific people only.',
      icon: 'file-lock',
    },
    {
      id: 'a2',
      severity: 'high',
      title: '12 old files shared with former contacts',
      description: 'Files from 2021–2022 are still shared with email addresses that may belong to old colleagues or organisations.',
      recommendation: 'Review and remove sharing permissions for outdated collaborators.',
      icon: 'link',
    },
    {
      id: 'a3',
      severity: 'high',
      title: 'Large media file publicly accessible',
      description: 'Project_Demo_Recording.mp4 (1.8 GB) is publicly shared and has been accessed 47 times by unknown viewers.',
      recommendation: 'Restrict access or delete if no longer needed.',
      icon: 'hard-drive',
    },
    {
      id: 'a4',
      severity: 'high',
      title: '11 dormant website accounts detected',
      description: 'Accounts on Quora, StumbleUpon, and 9 other sites have not been active for over 2 years.',
      recommendation: 'Delete or deactivate these accounts to reduce your attack surface.',
      icon: 'user-x',
    },
    {
      id: 'a5',
      severity: 'medium',
      title: 'Old project folder shared externally',
      description: 'College_Project_Final/ is shared with 3 external accounts, some of which have not been active.',
      recommendation: 'Remove sharing or transfer ownership before archiving.',
      icon: 'globe',
    },
    {
      id: 'a6',
      severity: 'medium',
      title: 'Multiple resume versions shared',
      description: 'Resume_2023.pdf and Previous_Resume.pdf are both shared. Outdated resumes may contain sensitive personal details.',
      recommendation: 'Keep only the latest version shared; delete or restrict older ones.',
      icon: 'file-lock',
    },
    {
      id: 'a7',
      severity: 'low',
      title: 'Shared spreadsheet with personal budget data',
      description: 'Budget_2022.xlsx was shared for a collaboration in 2022 and is still accessible to 2 former contacts.',
      recommendation: 'Remove sharing access since the collaboration has ended.',
      icon: 'key',
    },
    {
      id: 'a8',
      severity: 'low',
      title: 'Inactive social media accounts',
      description: '3 social media accounts (Pinterest, Tumblr, MySpace) have not been updated in over 3 years.',
      recommendation: 'Consider deactivating or deleting these to reduce your digital footprint.',
      icon: 'clock',
    },
  ],
  recommendations: [
    {
      id: 'r1',
      priority: 'critical',
      title: 'Remove public file sharing',
      body: 'Internship_Documents.pdf is publicly accessible. Revoke the public link immediately to protect your personal information.',
      action: 'Fix in Drive',
      route: '/demo/drive-classifier',
    },
    {
      id: 'r2',
      priority: 'high',
      title: 'Audit old shared files',
      body: 'Review all files shared before 2023 and remove access from contacts you no longer work with.',
      action: 'Audit Drive',
      route: '/demo/drive-cleanup',
    },
    {
      id: 'r3',
      priority: 'medium',
      title: 'Delete dormant accounts',
      body: '11 inactive website accounts increase your attack surface. Delete or deactivate accounts on sites you no longer use.',
      action: 'Review Sites',
      route: '/demo/website-tracker',
    },
    {
      id: 'r4',
      priority: 'low',
      title: 'Clean up email subscriptions',
      body: 'You have 47 active subscriptions. Unsubscribing from unused newsletters reduces inbox noise and privacy exposure.',
      action: 'Manage Emails',
      route: '/demo/email-manager',
    },
  ],
};

// ---------------------------------------------------------------------------
// Email Classification
// ---------------------------------------------------------------------------
// Matches the shape expected by EmailClassification.js (flattenClassified)
export const demoEmailData = {
  totalEmails: 3_284,
  categoryCounts: {
    Spam:         462,
    Marketing:    891,
    Newsletters:  312,
    'Social Media': 228,
    Automated:    187,
    Financial:     94,
    Work:         184,
    Personal:     126,
    'Low Priority': 800,
  },
  classified: {
    Spam: [
      { id: 'sp1', from: 'noreply@prize-central.net',      subject: 'Congratulations! You have been selected…',    date: '2024-06-10' },
      { id: 'sp2', from: 'offers@deals-unlimited.biz',     subject: 'Exclusive 70% off — limited time offer!',      date: '2024-06-09' },
      { id: 'sp3', from: 'win@lottery-claims.org',         subject: 'Your unclaimed prize is waiting for you',      date: '2024-06-08' },
      { id: 'sp4', from: 'admin@free-gift-zone.com',       subject: 'Claim your FREE $500 Amazon gift card now',    date: '2024-06-07' },
      { id: 'sp5', from: 'info@quick-cash-offer.net',      subject: 'Make $3,500/week from home — no experience',   date: '2024-06-06' },
      { id: 'sp6', from: 'noreply@lucky-spin-today.com',   subject: 'You\'ve been chosen for today\'s grand spin',  date: '2024-06-05' },
      { id: 'sp7', from: 'deals@super-savings-hub.biz',    subject: 'URGENT: Your account needs verification',      date: '2024-06-04' },
    ],
    Marketing: [
      { id: 'mk1', from: 'Amazon <store-news@amazon.com>',         subject: 'Your order has shipped — track it now',           date: '2024-06-10' },
      { id: 'mk2', from: 'Swiggy <noreply@swiggy.in>',             subject: '50% off on your next order — today only!',         date: '2024-06-10' },
      { id: 'mk3', from: 'Myntra <newsletter@myntra.com>',         subject: 'End of Season Sale — up to 80% off',               date: '2024-06-09' },
      { id: 'mk4', from: 'Zomato <no-reply@zomato.com>',           subject: 'Weekend Special: Free delivery on orders above ₹199', date: '2024-06-09' },
      { id: 'mk5', from: 'Flipkart <noreply@flipkart.com>',        subject: 'Big Billion Days preview — set your reminders',    date: '2024-06-08' },
      { id: 'mk6', from: 'BookMyShow <noreply@bookmyshow.com>',    subject: 'New movies this weekend — book now!',              date: '2024-06-07' },
      { id: 'mk7', from: 'Meesho <no-reply@meesho.com>',           subject: 'Super saver deals just for you',                  date: '2024-06-06' },
      { id: 'mk8', from: 'Urban Company <hello@urbancompany.com>', subject: 'Salon at home — 30% off this week',               date: '2024-06-05' },
    ],
    Newsletters: [
      { id: 'nl1', from: 'Morning Brew <hello@morningbrew.com>',   subject: 'Your daily business briefing — June 10',          date: '2024-06-10' },
      { id: 'nl2', from: 'TLDR Newsletter <dan@tldrnewsletter.com>', subject: 'TLDR: Top tech trends this week',               date: '2024-06-09' },
      { id: 'nl3', from: 'HackerNoon <no-reply@hackernoon.com>',   subject: 'Top stories: AI in 2024 and beyond',             date: '2024-06-08' },
      { id: 'nl4', from: 'Product Hunt <stories@producthunt.com>', subject: 'The best new products today',                    date: '2024-06-07' },
      { id: 'nl5', from: 'The Hustle <team@thehustle.co>',         subject: 'This startup raised $50M with one slide deck',   date: '2024-06-06' },
    ],
    'Social Media': [
      { id: 'sm1', from: 'LinkedIn <notifications@linkedin.com>',  subject: 'Alex, you appeared in 14 searches this week',    date: '2024-06-10' },
      { id: 'sm2', from: 'LinkedIn <jobs@linkedin.com>',           subject: '12 new jobs match your profile',                 date: '2024-06-09' },
      { id: 'sm3', from: 'GitHub <noreply@github.com>',            subject: 'Security alert: new sign-in to your account',   date: '2024-06-08' },
      { id: 'sm4', from: 'Twitter/X <notify@twitter.com>',        subject: 'Trending in your area: #TechSummit2024',         date: '2024-06-07' },
      { id: 'sm5', from: 'Reddit <noreply@reddit.com>',            subject: 'Popular in r/privacy: "Stop using this app"',   date: '2024-06-06' },
    ],
    Automated: [
      { id: 'au1', from: 'HDFC Bank <alerts@hdfcbank.com>',        subject: 'Transaction alert: ₹2,450 debited — June 10',   date: '2024-06-10' },
      { id: 'au2', from: 'Jira <jira@atlassian.com>',              subject: 'PROJ-2741: Task assigned to you',               date: '2024-06-09' },
      { id: 'au3', from: 'Google <no-reply@accounts.google.com>',  subject: 'New sign-in from Chrome on Windows',            date: '2024-06-08' },
      { id: 'au4', from: 'AWS <aws-billing@amazon.com>',           subject: 'Your AWS bill for May 2024',                    date: '2024-06-07' },
    ],
    Financial: [
      { id: 'fi1', from: 'HDFC Bank <estatement@hdfcbank.com>',    subject: 'Your May 2024 bank statement is ready',         date: '2024-06-05' },
      { id: 'fi2', from: 'Zerodha <reports@zerodha.com>',          subject: 'Contract note: BUY INFY 20 shares',             date: '2024-06-04' },
      { id: 'fi3', from: 'ET Money <hello@etmoney.com>',           subject: 'Your SIP of ₹5,000 has been processed',         date: '2024-06-03' },
    ],
    Work: [
      { id: 'wk1', from: 'Rohan Mehta <r.mehta@company.com>',      subject: 'Meeting scheduled: Sprint review — Friday 3 PM', date: '2024-06-10' },
      { id: 'wk2', from: 'HR Team <hr@company.com>',               subject: 'Annual appraisal cycle starting June 15',       date: '2024-06-09' },
      { id: 'wk3', from: 'Priya Sharma <p.sharma@company.com>',    subject: 'Re: Q3 roadmap document — feedback needed',     date: '2024-06-08' },
      { id: 'wk4', from: 'Confluence <notify@atlassian.com>',      subject: 'Page updated: Architecture Decision Records',   date: '2024-06-07' },
      { id: 'wk5', from: 'Zoom <no-reply@zoom.us>',                subject: 'Your recording is ready: Team Standup 06/07',   date: '2024-06-06' },
    ],
    Personal: [
      { id: 'pe1', from: 'Aditya Joshi <aditya.j@gmail.com>',      subject: 'Re: Weekend trek plans — Lonavala?',            date: '2024-06-10' },
      { id: 'pe2', from: 'Mom <meenakshi.m@gmail.com>',            subject: 'Flight tickets for Diwali — did you book?',     date: '2024-06-08' },
      { id: 'pe3', from: 'Internship Notification <hr@techcorp.io>',subject: 'Internship opportunity — Summer 2024',          date: '2024-06-06' },
    ],
    'Low Priority': [
      { id: 'lp1', from: 'Coursera <no-reply@coursera.org>',       subject: 'Your certificate is ready to download',         date: '2024-06-09' },
      { id: 'lp2', from: 'Duolingo <hello@duolingo.com>',          subject: 'You\'re on a 7-day streak! Keep it up!',        date: '2024-06-08' },
      { id: 'lp3', from: 'Goodreads <noreply@goodreads.com>',      subject: 'Reading challenge update: You\'re on track!',   date: '2024-06-07' },
      { id: 'lp4', from: 'Notion <noreply@notionhq.com>',          subject: 'Workspace updates for June 2024',               date: '2024-06-06' },
      { id: 'lp5', from: 'Medium <noreply@medium.com>',            subject: 'Stories curated for you this week',             date: '2024-06-05' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Email Subscriptions
// ---------------------------------------------------------------------------
export const demoSubscriptions = {
  subscriptions: [
    { email: 'newsletter@swiggy.in',       sender: 'Swiggy',          subject: 'Food deals & offers',          count: 47, category: 'Marketing',  canUnsubscribe: true  },
    { email: 'offers@amazon.com',          sender: 'Amazon',          subject: 'Product recommendations',      count: 62, category: 'Marketing',  canUnsubscribe: true  },
    { email: 'news@medium.com',            sender: 'Medium',          subject: 'Weekly digest & stories',      count: 38, category: 'Newsletter', canUnsubscribe: true  },
    { email: 'updates@duolingo.com',       sender: 'Duolingo',        subject: 'Streak reminders & updates',   count: 91, category: 'Social',     canUnsubscribe: true  },
    { email: 'weekly@linkedin.com',        sender: 'LinkedIn',        subject: 'Job & connection updates',     count: 56, category: 'Social',     canUnsubscribe: true  },
    { email: 'hello@morningbrew.com',      sender: 'Morning Brew',    subject: 'Daily business briefing',      count: 88, category: 'Newsletter', canUnsubscribe: true  },
    { email: 'deals@flipkart.com',         sender: 'Flipkart',        subject: 'Sale & discount alerts',       count: 73, category: 'Marketing',  canUnsubscribe: true  },
    { email: 'noreply@github.com',         sender: 'GitHub',          subject: 'Repository & security alerts', count: 29, category: 'Updates',    canUnsubscribe: false },
    { email: 'newsletter@producthunt.com', sender: 'Product Hunt',    subject: 'Top products daily',           count: 61, category: 'Newsletter', canUnsubscribe: true  },
    { email: 'digest@reddit.com',          sender: 'Reddit',          subject: 'Community highlights',         count: 44, category: 'Social',     canUnsubscribe: true  },
    { email: 'news@zomato.com',            sender: 'Zomato',          subject: 'Restaurant promos & offers',   count: 52, category: 'Marketing',  canUnsubscribe: true  },
    { email: 'daily@tldr.tech',            sender: 'TLDR Newsletter', subject: 'Tech news daily',              count: 76, category: 'Newsletter', canUnsubscribe: true  },
    { email: 'alerts@googlephotos.com',    sender: 'Google Photos',   subject: 'Memory & storage alerts',      count: 15, category: 'Updates',    canUnsubscribe: true  },
    { email: 'news@coursera.org',          sender: 'Coursera',        subject: 'Course recommendations',       count: 33, category: 'Newsletter', canUnsubscribe: true  },
    { email: 'noreply@notion.so',          sender: 'Notion',          subject: 'Workspace tips & updates',     count: 21, category: 'Updates',    canUnsubscribe: true  },
  ],
};

// ---------------------------------------------------------------------------
// Google Drive — Scored files (for Drive Decay / DriveCleanup)
// ---------------------------------------------------------------------------
export const demoDriveFiles = [
  { id: 'f1',  name: 'Old_Project_Backup.zip',       category: 'Archives',   sizeBytes: 524_288_000,  decayScore: 0.91, isJunk: true  },
  { id: 'f2',  name: 'Resume_2023.pdf',               category: 'Documents',  sizeBytes:   2_097_152,  decayScore: 0.62, isJunk: false },
  { id: 'f3',  name: 'College_Project_Final.zip',     category: 'Archives',   sizeBytes: 189_530_112,  decayScore: 0.88, isJunk: true  },
  { id: 'f4',  name: 'Internship_Documents.pdf',      category: 'Documents',  sizeBytes:   4_194_304,  decayScore: 0.45, isJunk: false },
  { id: 'f5',  name: 'Screenshots_2022.zip',          category: 'Archives',   sizeBytes:  73_400_320,  decayScore: 0.84, isJunk: true  },
  { id: 'f6',  name: 'Old_Presentation.pptx',         category: 'Documents',  sizeBytes:  12_582_912,  decayScore: 0.79, isJunk: true  },
  { id: 'f7',  name: 'Duplicate_Photos.zip',          category: 'Media',      sizeBytes: 314_572_800,  decayScore: 0.93, isJunk: true  },
  { id: 'f8',  name: 'Important_Documents.pdf',       category: 'Documents',  sizeBytes:   1_048_576,  decayScore: 0.15, isJunk: false },
  { id: 'f9',  name: 'Previous_Resume.pdf',           category: 'Documents',  sizeBytes:   1_572_864,  decayScore: 0.68, isJunk: false },
  { id: 'f10', name: 'Archived_Project.zip',          category: 'Archives',   sizeBytes:  83_886_080,  decayScore: 0.87, isJunk: true  },
  { id: 'f11', name: 'Project_Demo_Recording.mp4',    category: 'Media',      sizeBytes: 1_879_048_192, decayScore: 0.72, isJunk: true  },
  { id: 'f12', name: 'Budget_2022.xlsx',              category: 'Documents',  sizeBytes:    524_288,   decayScore: 0.71, isJunk: true  },
  { id: 'f13', name: 'Meeting_Notes_Q1.docx',         category: 'Documents',  sizeBytes:    262_144,   decayScore: 0.55, isJunk: false },
  { id: 'f14', name: 'API_Design_v1.pdf',             category: 'Documents',  sizeBytes:   3_145_728,  decayScore: 0.38, isJunk: false },
  { id: 'f15', name: 'Wallpapers_Pack.zip',           category: 'Media',      sizeBytes:  52_428_800,  decayScore: 0.80, isJunk: true  },
  { id: 'f16', name: 'College_Notes_Sem4.pdf',        category: 'Documents',  sizeBytes:   8_388_608,  decayScore: 0.76, isJunk: true  },
  { id: 'f17', name: 'App_Architecture_v3.pdf',       category: 'Documents',  sizeBytes:   5_242_880,  decayScore: 0.22, isJunk: false },
  { id: 'f18', name: 'SDE_Interview_Prep.pdf',        category: 'Documents',  sizeBytes:  15_728_640,  decayScore: 0.31, isJunk: false },
  { id: 'f19', name: 'Temp_Downloads.zip',            category: 'Archives',   sizeBytes:  41_943_040,  decayScore: 0.89, isJunk: true  },
  { id: 'f20', name: 'Video_Lectures_2021.zip',       category: 'Media',      sizeBytes: 629_145_600,  decayScore: 0.92, isJunk: true  },
  { id: 'f21', name: 'Cover_Letter_Template.docx',    category: 'Documents',  sizeBytes:    131_072,   decayScore: 0.48, isJunk: false },
  { id: 'f22', name: 'Design_Assets_Old.zip',         category: 'Archives',   sizeBytes:  94_371_840,  decayScore: 0.83, isJunk: true  },
  { id: 'f23', name: 'index.html',                    category: 'Other',      sizeBytes:     20_480,   decayScore: 0.35, isJunk: false },
  { id: 'f24', name: 'Personal_Diary_2020.docx',      category: 'Documents',  sizeBytes:    786_432,   decayScore: 0.60, isJunk: false },
  { id: 'f25', name: 'Hackathon_Submission.zip',      category: 'Archives',   sizeBytes:  26_214_400,  decayScore: 0.66, isJunk: false },
];

// ---------------------------------------------------------------------------
// Drive Summary (for StorageChart)
// ---------------------------------------------------------------------------
export const demoDriveSummary = {
  Documents: { count: 12, sizeBytes: 44_040_192  },
  Media:     { count:  5, sizeBytes: 2_875_539_456 },
  Archives:  { count:  8, sizeBytes: 1_033_471_488 },
  Folders:   { count:  3, sizeBytes:   15_728_640  },
  Other:     { count:  2, sizeBytes:    20_971_520  },
};

// ---------------------------------------------------------------------------
// Drive Classifier — classified files (for DriveClassifier page)
// ---------------------------------------------------------------------------
export const demoDriveClassifierData = {
  summary: {
    totalFiles:  30,
    totalSizeBytes: 4_286_578_688,
    categoryBreakdown: {
      Documents:     { count: 12, sizeBytes:   44_040_192 },
      Images:        { count:  4, sizeBytes:   83_886_080 },
      Videos:        { count:  3, sizeBytes: 2_832_595_968 },
      Audio:         { count:  0, sizeBytes:            0 },
      PDFs:          { count:  5, sizeBytes:   25_165_824 },
      Presentations: { count:  2, sizeBytes:   16_777_216 },
      Spreadsheets:  { count:  1, sizeBytes:      524_288 },
      Archives:      { count:  8, sizeBytes: 1_063_256_064 },
      Code:          { count:  1, sizeBytes:       65_536 },
      Others:        { count:  2, sizeBytes:    5_242_880 },
    },
  },
  classifiedFiles: [
    { id: 'cf1',  name: 'App_Architecture_v3.pdf',    classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:   5_242_880, modifiedTime: '2024-04-20', createdTime: '2024-01-15' },
    { id: 'cf2',  name: 'Resume_2023.pdf',            classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:   2_097_152, modifiedTime: '2024-03-10', createdTime: '2023-07-05' },
    { id: 'cf3',  name: 'Internship_Documents.pdf',   classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:   4_194_304, modifiedTime: '2024-02-28', createdTime: '2023-11-20' },
    { id: 'cf4',  name: 'SDE_Interview_Prep.pdf',     classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:  15_728_640, modifiedTime: '2024-01-12', createdTime: '2023-09-01' },
    { id: 'cf5',  name: 'College_Notes_Sem4.pdf',     classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:   8_388_608, modifiedTime: '2022-11-30', createdTime: '2022-07-15' },
    { id: 'cf6',  name: 'Old_Presentation.pptx',      classifiedCategory: 'Presentations', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', sizeBytes: 12_582_912, modifiedTime: '2022-08-14', createdTime: '2022-04-10' },
    { id: 'cf7',  name: 'Product_Deck_Q3.pptx',       classifiedCategory: 'Presentations', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', sizeBytes:  4_194_304, modifiedTime: '2024-05-18', createdTime: '2024-03-22' },
    { id: 'cf8',  name: 'Budget_2022.xlsx',            classifiedCategory: 'Spreadsheets',  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',         sizeBytes:    524_288, modifiedTime: '2022-12-31', createdTime: '2022-01-04' },
    { id: 'cf9',  name: 'Meeting_Notes_Q1.docx',       classifiedCategory: 'Documents',     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   sizeBytes:    262_144, modifiedTime: '2024-04-05', createdTime: '2024-01-08' },
    { id: 'cf10', name: 'Cover_Letter_Template.docx',  classifiedCategory: 'Documents',     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   sizeBytes:    131_072, modifiedTime: '2023-10-14', createdTime: '2023-08-22' },
    { id: 'cf11', name: 'Personal_Diary_2020.docx',    classifiedCategory: 'Documents',     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   sizeBytes:    786_432, modifiedTime: '2020-12-31', createdTime: '2020-01-01' },
    { id: 'cf12', name: 'API_Design_v1.pdf',           classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:   3_145_728, modifiedTime: '2023-06-20', createdTime: '2023-05-01' },
    { id: 'cf13', name: 'Project_Demo_Recording.mp4',  classifiedCategory: 'Videos',        mimeType: 'video/mp4',                 sizeBytes: 1_879_048_192, modifiedTime: '2023-09-10', createdTime: '2023-08-15' },
    { id: 'cf14', name: 'Hackathon_Demo.mp4',           classifiedCategory: 'Videos',        mimeType: 'video/mp4',                 sizeBytes:  524_288_000, modifiedTime: '2023-11-05', createdTime: '2023-10-28' },
    { id: 'cf15', name: 'Screen_Recording_Tutorial.mp4', classifiedCategory: 'Videos',      mimeType: 'video/mp4',                 sizeBytes:  429_259_776, modifiedTime: '2024-02-18', createdTime: '2024-02-01' },
    { id: 'cf16', name: 'Profile_Photo.jpg',            classifiedCategory: 'Images',        mimeType: 'image/jpeg',                sizeBytes:   2_097_152, modifiedTime: '2024-05-01', createdTime: '2024-04-28' },
    { id: 'cf17', name: 'Certificate_Coursera.png',     classifiedCategory: 'Images',        mimeType: 'image/png',                 sizeBytes:   1_048_576, modifiedTime: '2024-03-22', createdTime: '2024-03-22' },
    { id: 'cf18', name: 'Screenshot_2022_001.png',      classifiedCategory: 'Images',        mimeType: 'image/png',                 sizeBytes:   3_145_728, modifiedTime: '2022-06-14', createdTime: '2022-06-14' },
    { id: 'cf19', name: 'Banner_Design.jpg',            classifiedCategory: 'Images',        mimeType: 'image/jpeg',                sizeBytes:   5_242_880, modifiedTime: '2023-12-10', createdTime: '2023-11-30' },
    { id: 'cf20', name: 'Old_Project_Backup.zip',       classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes: 524_288_000, modifiedTime: '2022-03-15', createdTime: '2021-12-01' },
    { id: 'cf21', name: 'College_Project_Final.zip',    classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes: 189_530_112, modifiedTime: '2022-05-20', createdTime: '2022-04-10' },
    { id: 'cf22', name: 'Screenshots_2022.zip',         classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes:  73_400_320, modifiedTime: '2022-12-31', createdTime: '2022-01-01' },
    { id: 'cf23', name: 'Duplicate_Photos.zip',         classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes: 314_572_800, modifiedTime: '2023-02-28', createdTime: '2023-01-15' },
    { id: 'cf24', name: 'Archived_Project.zip',         classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes:  83_886_080, modifiedTime: '2022-07-10', createdTime: '2022-01-20' },
    { id: 'cf25', name: 'Temp_Downloads.zip',           classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes:  41_943_040, modifiedTime: '2023-04-15', createdTime: '2023-03-01' },
    { id: 'cf26', name: 'Design_Assets_Old.zip',        classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes:  94_371_840, modifiedTime: '2022-09-30', createdTime: '2022-06-01' },
    { id: 'cf27', name: 'Video_Lectures_2021.zip',      classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes: 629_145_600, modifiedTime: '2021-12-01', createdTime: '2021-07-01' },
    { id: 'cf28', name: 'Wallpapers_Pack.zip',          classifiedCategory: 'Archives',      mimeType: 'application/zip',           sizeBytes:  52_428_800, modifiedTime: '2023-05-20', createdTime: '2023-04-01' },
    { id: 'cf29', name: 'index.html',                   classifiedCategory: 'Code',          mimeType: 'text/html',                 sizeBytes:     65_536,  modifiedTime: '2024-05-28', createdTime: '2024-05-28' },
    { id: 'cf30', name: 'Important_Documents.pdf',      classifiedCategory: 'PDFs',          mimeType: 'application/pdf',           sizeBytes:   1_048_576, modifiedTime: '2024-06-01', createdTime: '2024-01-01' },
  ],
};

// ---------------------------------------------------------------------------
// Website Tracker data
// ---------------------------------------------------------------------------
export const demoWebsiteData = {
  totalWebsites: 142,
  activeCount:   89,
  inactiveCount: 53,
  websites: [
    { domain: 'github.com',       status: 'active',   lastVisited: '2024-06-10', category: 'Development' },
    { domain: 'linkedin.com',     status: 'active',   lastVisited: '2024-06-09', category: 'Professional' },
    { domain: 'stackoverflow.com',status: 'active',   lastVisited: '2024-06-08', category: 'Development' },
    { domain: 'amazon.in',        status: 'active',   lastVisited: '2024-06-10', category: 'Shopping' },
    { domain: 'netflix.com',      status: 'active',   lastVisited: '2024-06-07', category: 'Entertainment' },
    { domain: 'quora.com',        status: 'inactive', lastVisited: '2022-03-14', category: 'Social' },
    { domain: 'stumbleupon.com',  status: 'inactive', lastVisited: '2019-08-22', category: 'Social' },
    { domain: 'myspace.com',      status: 'inactive', lastVisited: '2018-01-10', category: 'Social' },
    { domain: 'pinterest.com',    status: 'inactive', lastVisited: '2021-11-05', category: 'Social' },
    { domain: 'tumblr.com',       status: 'inactive', lastVisited: '2020-06-30', category: 'Social' },
  ],
};

// ---------------------------------------------------------------------------
// Dashboard metric cards (fed into Dashboard.js metrics array)
// ---------------------------------------------------------------------------
export const demoDashboardMetrics = {
  emailHealth:   { value: '3,284', subtitle: 'Emails processed',       status: 'warning', trend: '+18%',    trendDirection: 'up' },
  storageStatus: { value: '62%',   subtitle: 'Storage utilised',       status: 'warning', trend: '+12%',    trendDirection: 'up' },
  digitalWellness: { value: '8.7 GB', subtitle: 'Space freed this month', status: 'excellent', trend: '+3.2 GB', trendDirection: 'up' },
};

// ---------------------------------------------------------------------------
// Dashboard module stats (override the hardcoded text in Dashboard.js)
// ---------------------------------------------------------------------------
export const demoDashboardModuleStats = {
  'Website Tracker':              '142 accounts tracked',
  'Email Subscription Manager':  '47 subscriptions found',
  'Drive File Classifier':        '1,247 files analyzed',
  'Drive Decay Detector':         '892 unused files',
  'Photos Scanner':               '156 junk photos found',
  'Data Leak Monitor':            '4 alerts active',
  'AI Risk Predictor':            'Moderate risk detected',
  'Instant Leak Alerts':          '2 credentials at risk',
  'Auto Cleanup':                 '12.4 GB ready to clean',
  'Digital Risk Score':           '68/100 Moderate',
};
