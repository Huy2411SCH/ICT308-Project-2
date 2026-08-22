// Placeholder data — belongs to the signed-in user once wired to a backend.
export const MOCK_FILES = [
  {
    id: 1,
    name: 'Q4 Strategy Meeting.mp4',
    type: 'video',
    duration: '45:32',
    date: 'May 18, 2026',
    size: '210 MB',
    status: 'ready',
    transcript: [
      { speaker: 'Alex Rivera', time: '00:00', text: "Let's get started — thanks everyone for making time for the Q4 strategy review." },
      { speaker: 'Priya Nair', time: '00:24', text: 'Revenue is tracking about 8% ahead of plan, mostly driven by the enterprise tier.' },
      { speaker: 'Alex Rivera', time: '01:10', text: "Good news. What's the risk on the churn side going into next quarter?" },
      { speaker: 'Priya Nair', time: '01:32', text: 'Churn is flat, but two of our larger accounts are up for renewal in December.' },
    ],
    summary: {
      overview: 'The team reviewed Q4 performance, noting revenue is ahead of plan while flagging renewal risk for two major accounts in December.',
      keyPoints: [
        'Revenue is tracking ~8% ahead of plan, led by the enterprise tier.',
        'Customer churn is flat quarter over quarter.',
        'Two large accounts are up for renewal in December.',
      ],
      actionItems: [
        'Priya to prepare renewal outreach plan for at-risk December accounts.',
        'Alex to review enterprise pipeline ahead of next review.',
      ],
    },
  },
  {
    id: 2,
    name: 'Client Onboarding Call.mp3',
    type: 'audio',
    duration: '22:10',
    date: 'May 12, 2026',
    size: '18 MB',
    status: 'processing',
    transcript: null,
    summary: null,
  },
  {
    id: 3,
    name: 'Sprint Retro Notes.txt',
    type: 'transcript',
    duration: null,
    date: 'May 5, 2026',
    size: '4 KB',
    status: 'ready',
    transcript: [
      { text: 'What went well: the new deploy pipeline cut release time in half.' },
      { text: 'What could improve: sprint planning ran long because of unclear ticket scope.' },
      { text: 'Action: add a "definition of ready" checklist before tickets enter the sprint.' },
    ],
    summary: {
      overview: 'The team retro highlighted a big win from the new deploy pipeline and a recurring pain point around unclear ticket scope.',
      keyPoints: [
        'Deploy pipeline changes cut release time by roughly 50%.',
        'Sprint planning is running long due to underspecified tickets.',
      ],
      actionItems: [
        'Introduce a "definition of ready" checklist for sprint planning.',
      ],
    },
  },
  {
    id: 4,
    name: 'Design Review.mp4',
    type: 'video',
    duration: '31:08',
    date: 'Apr 29, 2026',
    size: '156 MB',
    status: 'ready',
    transcript: [
      { speaker: 'Jordan Lee', time: '00:00', text: 'Walking through the updated onboarding flow — first pass is in Figma.' },
      { speaker: 'Sam Okafor', time: '02:15', text: 'The empty state on step two feels a bit bare, can we add an illustration?' },
      { speaker: 'Jordan Lee', time: '02:40', text: 'Sure, I can source one from the icon set we already use.' },
    ],
    summary: {
      overview: 'Design walked through the updated onboarding flow; feedback focused on the empty state in step two.',
      keyPoints: [
        'First pass of the onboarding flow redesign was presented in Figma.',
        'Step two empty state needs a supporting illustration.',
      ],
      actionItems: [
        'Jordan to add an illustration to the step two empty state.',
      ],
    },
  },
]
