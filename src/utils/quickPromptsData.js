import {
  CodeIcon,
  PenIcon,
  SearchIcon,
  ChartIcon,
  PhotoIcon,
  BugIcon,
  ZapIcon,
  LayersIcon,
  CheckIcon,
  MailIcon,
  FileTextIcon,
  EditIcon,
  SparkleIcon,
  TrendingUpIcon,
  BookIcon,
  CameraIcon,
  PaletteIcon,
  ClipboardIcon,
} from '../components/Icons';

// Quick-prompt pill key for the Image pill. Centralised so call-sites that
// need to trigger image-specific behaviour (modality switch, telemetry) can
// compare against a single symbol instead of a magic string.
export const IMAGE_QUICK_PROMPT_KEY = 'image';

export const promptsData = {
  code: {
    title: 'Code',
    icon: CodeIcon,
    items: [
      { text: 'Debug a React TypeError', icon: BugIcon },
      { text: 'Refactor this function for performance', icon: ZapIcon },
      { text: 'Explain this codebase architecture', icon: LayersIcon },
      { text: 'Write tests for this module', icon: CheckIcon },
    ],
  },
  write: {
    title: 'Write',
    icon: PenIcon,
    items: [
      { text: 'Draft a follow-up email to a recruiter', icon: MailIcon },
      { text: 'Write a LinkedIn post about a product launch', icon: SparkleIcon },
      { text: 'Outline a blog article on a given topic', icon: FileTextIcon },
      { text: 'Rewrite this paragraph more concisely', icon: EditIcon },
    ],
  },
  research: {
    title: 'Research',
    icon: SearchIcon,
    items: [
      { text: 'What happened in AI this week', icon: SparkleIcon },
      { text: 'Compare the top 3 project management tools in 2026', icon: LayersIcon },
      { text: 'Find recent studies on intermittent fasting', icon: BookIcon },
      { text: "Summarise today's market movements", icon: TrendingUpIcon },
    ],
  },
  [IMAGE_QUICK_PROMPT_KEY]: {
    title: 'Image',
    icon: PhotoIcon,
    items: [
      { text: 'A minimalist logo for a fintech startup', icon: SparkleIcon },
      { text: 'Cinematic photo of a London street at dusk', icon: CameraIcon },
      { text: 'Infographic showing the AI provider landscape', icon: ChartIcon },
      { text: 'Watercolour illustration of a coastal village', icon: PaletteIcon },
    ],
  },
  analyze: {
    title: 'Analyse',
    icon: ChartIcon,
    items: [
      { text: 'Analyse this CSV and find trends', icon: TrendingUpIcon },
      { text: 'Summarise this PDF in 5 bullets', icon: FileTextIcon },
      { text: 'Extract action items from these meeting notes', icon: ClipboardIcon },
      { text: 'Compare these two contracts', icon: LayersIcon },
    ],
  },
};

export const quickPromptKeys = ['code', 'write', 'research', IMAGE_QUICK_PROMPT_KEY, 'analyze'];
