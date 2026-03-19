import {
  CodeIcon,
  PenIcon,
  SearchIcon,
  ChartIcon,
  SparkleIcon,
  BookIcon,
  BugIcon,
  LightbulbIcon,
  ZapIcon,
  MailIcon,
  FileTextIcon,
  CopyIcon,
  TrendingUpIcon,
  ClipboardIcon,
  EyeIcon,
  PuzzleIcon,
  LayersIcon,
  HelpCircleIcon,
} from '../components/Icons';

export const promptsData = {
  code: {
    title: 'Code',
    icon: CodeIcon,
    items: [
      { text: 'Debug a React TypeError', icon: BugIcon },
      { text: 'Clean a CSV with Python pandas', icon: CodeIcon },
      { text: 'Explain JavaScript closures', icon: LightbulbIcon },
      { text: 'Optimise an API for 10k requests', icon: ZapIcon },
    ],
  },
  write: {
    title: 'Write',
    icon: PenIcon,
    items: [
      { text: 'Draft a team project update email', icon: MailIcon },
      { text: 'Summarise an article into key points', icon: FileTextIcon },
      { text: 'Write SaaS landing page copy', icon: CopyIcon },
      { text: 'Write REST API documentation', icon: ClipboardIcon },
    ],
  },
  research: {
    title: 'Research',
    icon: SearchIcon,
    items: [
      { text: 'Latest LLM breakthroughs', icon: SearchIcon },
      { text: 'Compare React vs Vue vs Svelte', icon: LayersIcon },
      { text: 'AI startup landscape 2026', icon: TrendingUpIcon },
      { text: "Cloud computing's environmental impact", icon: ClipboardIcon },
    ],
  },
  analyze: {
    title: 'Analyse',
    icon: ChartIcon,
    items: [
      { text: 'Find top customer churn factors', icon: EyeIcon },
      { text: "Predict next quarter's sales trends", icon: PuzzleIcon },
      { text: 'Actionable insights from user metrics', icon: LightbulbIcon },
      { text: 'Competitive analysis report', icon: ClipboardIcon },
    ],
  },
  create: {
    title: 'Create',
    icon: SparkleIcon,
    items: [
      { text: 'AI + healthcare startup ideas', icon: LightbulbIcon },
      { text: 'Design a project management dashboard', icon: PuzzleIcon },
      { text: 'Spec a habit-tracking mobile app', icon: LayersIcon },
      { text: 'Plan a 12-post tech blog calendar', icon: SparkleIcon },
    ],
  },
  learn: {
    title: 'Learn',
    icon: BookIcon,
    items: [
      { text: 'How backpropagation works', icon: LightbulbIcon },
      { text: 'Distributed systems & CAP theorem', icon: BookIcon },
      { text: 'Git branching strategies compared', icon: LayersIcon },
      { text: 'Quiz me on data structures', icon: HelpCircleIcon },
    ],
  },
};

export const quickPromptKeys = ['code', 'write', 'research', 'analyze', 'create', 'learn'];
