'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  ChatMessage,
  QdrantStatus,
  ProjectSummary,
  ChatSession,
} from '@/types';
import { OpenUIRenderer } from '@/components/openui/OpenUIRenderer';
import {
  Bot,
  Layers,
  Search,
  Scale,
  Send,
  Loader2,
  Database,
  RefreshCw,
  Plus,
  Check,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Copy,
  FolderGit2,
  Trash2,
  Target,
  Sparkles,
  MessageSquare,
  MessageCircle,
  Edit2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  UserCheck,
  AtSign,
  Hash,
  Terminal,
  Shield,
  HelpCircle,
  Activity,
} from 'lucide-react';

interface SlashSkillItem {
  name: string;
  command: string;
  syntax: string;
  description: string;
  badge: string;
  icon: any;
  color: string;
}

const AVAILABLE_SLASH_SKILLS: SlashSkillItem[] = [
  {
    name: '3-Agent Viability Swarm',
    command: '/eval',
    syntax: '/eval <idea proposal>',
    description: 'Autonomous 3-agent evaluation: The Judge + Researcher + Planner + Live UI',
    badge: 'SWARM',
    icon: Scale,
    color: 'text-[#FF5533]',
  },
  {
    name: 'Feature Planner & Blueprint',
    command: '/plan',
    syntax: '/plan <feature or spec>',
    description: 'Technical architecture, API contracts, database schema & 1-click roadmap tasks',
    badge: 'ARCHITECT',
    icon: Layers,
    color: 'text-amber-500',
  },
  {
    name: 'Market & Tech Feasibility',
    command: '/research',
    syntax: '/research <topic or library>',
    description: 'Competitor benchmarks, open-source library reuse & failure mode scout',
    badge: 'SCOUT',
    icon: Search,
    color: 'text-[#0047FF]',
  },
  {
    name: 'Security & Scalability Audit',
    command: '/audit',
    syntax: '/audit <target system or feature>',
    description: 'OWASP security, IDOR, SQL/NoSQL safety, N+1 query patterns & concurrency audit',
    badge: 'SECURITY',
    icon: ShieldCheck,
    color: 'text-rose-600',
  },
  {
    name: 'OpenUI Generative UI Screen',
    command: '/openui',
    syntax: '/openui <ui brief or dashboard>',
    description: 'Generates live interactive generative UI screens powered by OUI-1 DSL',
    badge: 'OUI-1',
    icon: Sparkles,
    color: 'text-purple-600',
  },
  {
    name: 'Workspace Telemetry & Stats',
    command: '/stats',
    syntax: '/stats',
    description: 'Synthesizes repository status, Qdrant vectors & workspace metrics dashboard',
    badge: 'TELEMETRY',
    icon: Activity,
    color: 'text-emerald-600',
  },
  {
    name: 'Lean MVP Pivot Blueprint',
    command: '/pivot',
    syntax: '/pivot <complex feature>',
    description: 'Generates high-leverage lean MVP alternative to bypass over-engineering',
    badge: 'PIVOT',
    icon: Target,
    color: 'text-indigo-600',
  },
  {
    name: 'Command & Syntax Reference',
    command: '/help',
    syntax: '/help',
    description: 'Displays cheat-sheet for slash skills (/), repo tags (@), and idea tags (#)',
    badge: 'GUIDE',
    icon: HelpCircle,
    color: 'text-neutral-600',
  },
];

function generateClientMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateFallbackOpenUIFromJudge(subData: any, msg: any): string {
  const judge = subData?.judge;
  const score = judge?.score ?? 75;
  const signal = judge?.verdict_signal ?? (score >= 70 ? 'BUILD_NOW' : score >= 40 ? 'PROCEED_WITH_CAUTION' : 'DO_NOT_BUILD');
  const title = (judge?.verdict_title || msg?.content?.slice(0, 45) || 'Feature Viability Assessment').replace(/"/g, '\\"');
  const critique = (judge?.summary_verdict || 'Evaluated viability across architecture and market opportunity.').replace(/"/g, '\\"');
  const statusType = score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical';

  const suggested = (subData?.pivot_plan?.suggested_features || subData?.planner?.suggested_features || []).slice(0, 4);
  const tasks = suggested.map((f: any) => f.title).filter(Boolean);
  if (tasks.length === 0) {
    tasks.push('Setup architectural boundary', 'Implement core workflow', 'Verify automated tests');
  }

  return [
    `root = Container("${title}", "${signal}", "default", [verdictRow, metricsRow, checklist, feat1])`,
    `verdictRow = VerdictCard(${score}, "${signal}", "${title}", "${critique}")`,
    `metricsRow = Stack([m1, m2, m3], "row", "md")`,
    `m1 = StatMetric("Viability Score", "${score}/100", "${score >= 50 ? '+15%' : '-25%'}", "${statusType}")`,
    `m2 = StatMetric("Risk Assessment", "${score < 40 ? 'Elevated' : 'Low'}", "Quality Gates", "${statusType}")`,
    `m3 = StatMetric("Action Status", "${signal.replace(/_/g, ' ')}", "Judge Consensus", "neutral")`,
    `checklist = TaskChecklist("Implementation Roadmap", ${JSON.stringify(tasks)}, "ROADMAP")`,
    `feat1 = FeatureCard("${title}", "P1", "M", "Production verified component blueprint.", "action_add", "Add to Roadmap")`,
  ].join('\n');
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Multi-Chat Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>('New Chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Active sub-agent tab per message ID
  const [activeTabPerMessage, setActiveTabPerMessage] = useState<{ [msgId: string]: 'openui' | 'researcher' | 'judge' | 'planner' }>({});
  // Planner sub-tab per message ID (pivot vs original)
  const [plannerSubTabPerMessage, setPlannerSubTabPerMessage] = useState<{ [msgId: string]: 'pivot' | 'original' }>({});

  // Projects & Incubator Ideas for Grounded Context & Tagging
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Slash Skills & Mentions Autocomplete State
  const [mentionTrigger, setMentionTrigger] = useState<'/' | '@' | '#' | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [showMentions, setShowMentions] = useState(false);

  // Qdrant Telemetry State & OpenUI / OUI-1 Status
  const [qdrantStatus, setQdrantStatus] = useState<QdrantStatus | null>(null);
  const [oui1Status, setOui1Status] = useState<any>(null);
  const [isSyncingKnowledge, setIsSyncingKnowledge] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Action status (e.g. feature added)
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchQdrantStatus = async () => {
    try {
      const status = await api.getQdrantStatus();
      setQdrantStatus(status);
    } catch (err) {
      console.warn('Failed to fetch Qdrant status:', err);
    }
  };

  const fetchOui1Status = async () => {
    try {
      const status = await api.getOui1Status();
      setOui1Status(status);
    } catch (err) {
      console.warn('Failed to fetch OUI-1 status:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res: any = await api.get('/projects');
      setProjects(res || []);
    } catch (err) {
      console.warn('Failed to fetch projects list:', err);
    }
  };

  const fetchIdeas = async () => {
    try {
      const res: any = await api.get('/future-projects');
      setIdeas(res || []);
    } catch (err) {
      console.warn('Failed to fetch incubator ideas list:', err);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const res = await api.getChatSessionDetail(sessionId);
      if (res && res.messages) {
        setMessages(res.messages);
        setCurrentSessionTitle(res.session?.title || 'Chat');
      }
    } catch (err) {
      console.warn('Failed to load session messages:', err);
      // Fallback to general history
      fetchHistory();
    }
  };

  const fetchSessions = async (autoSelectFirst: boolean = true) => {
    setIsLoadingSessions(true);
    try {
      const res = await api.listChatSessions(selectedProjectId || undefined);
      const list = res.sessions || [];
      setSessions(list);

      if (autoSelectFirst) {
        if (list.length > 0) {
          const first = list[0];
          setCurrentSessionId(first.id);
          setCurrentSessionTitle(first.title);
          await loadSessionMessages(first.id);
        } else {
          setCurrentSessionId(null);
          setCurrentSessionTitle('New Chat');
          setMessages([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch chat sessions:', err);
      fetchHistory();
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentSessionTitle(target.title);
    }
    loadSessionMessages(sessionId);
  };

  const handleNewChat = async () => {
    try {
      const res = await api.createChatSession({
        title: 'New Chat',
        project_id: selectedProjectId || undefined,
      });
      const newSession = res.session;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setCurrentSessionTitle(newSession.title);
      setMessages([]);
      textareaRef.current?.focus();
    } catch (err) {
      setCurrentSessionId(null);
      setCurrentSessionTitle('New Chat');
      setMessages([]);
    }
  };

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = async (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTitle = editingTitle.trim();
    if (!cleanTitle) {
      setEditingSessionId(null);
      return;
    }
    try {
      await api.updateChatSession(sessionId, cleanTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: cleanTitle } : s))
      );
      if (currentSessionId === sessionId) {
        setCurrentSessionTitle(cleanTitle);
      }
    } catch (err: any) {
      alert(`Failed to rename: ${err.message}`);
    } finally {
      setEditingSessionId(null);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      await api.deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          setCurrentSessionId(null);
          setCurrentSessionTitle('New Chat');
          setMessages([]);
        }
      }
    } catch (err: any) {
      alert(`Failed to delete session: ${err.message}`);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.getChatHistory(selectedProjectId || undefined, currentSessionId || undefined);
      if (res && res.history) {
        setMessages(res.history);
      }
    } catch (err) {
      console.warn('Failed to fetch chat history:', err);
    }
  };

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/chat');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch initial telemetry, project list, incubator ideas, and user's isolated chat sessions
  useEffect(() => {
    if (isAuthenticated) {
      fetchQdrantStatus();
      fetchOui1Status();
      fetchProjects();
      fetchIdeas();
      fetchSessions(true);
    }
  }, [isAuthenticated, selectedProjectId]);

  // Stepper animation timer when evaluating via 3-sub-agent swarm
  useEffect(() => {
    if (!isSubmitting || !isEvaluating) {
      setActiveStep(0);
      return;
    }
    setActiveStep(1); // Stage 1: Context
    const timer1 = setTimeout(() => setActiveStep(2), 1200); // Stage 2: Researcher
    const timer2 = setTimeout(() => setActiveStep(3), 2500); // Stage 3: Judge
    const timer3 = setTimeout(() => setActiveStep(4), 3800); // Stage 4: Planner

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isSubmitting, isEvaluating]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting, activeStep]);

  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputValue).trim();
    if (!query || isSubmitting) return;

    const lower = query.toLowerCase();
    const isExplicitEval = lower.startsWith('/eval ') || lower.startsWith('/evaluate ');
    const isEvalTrigger = [
      'evaluate this idea', 'evaluate this feature', 'evaluate my idea',
      'rate this idea', 'judge this idea', 'should we build', 'should i build',
      'is it worth building', 'viability rating', 'design an automated', 'i want to rebuild'
    ].some((t) => lower.includes(t));
    const willEvaluate = isExplicitEval || isEvalTrigger;

    setIsEvaluating(willEvaluate);

    const userMessage: ChatMessage = {
      id: generateClientMessageId('user'),
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSubmitting(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.sendChatMessage({
        message: query,
        mode: isExplicitEval ? 'eval' : 'auto',
        project_id: selectedProjectId || undefined,
        session_id: currentSessionId || undefined,
        history: historyPayload,
      });

      if (response.session_id) {
        if (!currentSessionId || currentSessionId !== response.session_id) {
          setCurrentSessionId(response.session_id);
        }
        fetchSessions(false);
      }

      const assistantMessage: ChatMessage = {
        id: generateClientMessageId('ai'),
        role: 'assistant',
        content: response.response,
        mode: response.mode,
        subagent_data: response.subagent_data,
        citations: response.citations,
        tier_used: response.tier_used,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.subagent_data?.is_pipeline) {
        setActiveTabPerMessage((prev) => ({
          ...prev,
          [assistantMessage.id]: 'judge',
        }));
      } else if (response.mode === 'plan' || response.subagent_data?.planner) {
        setActiveTabPerMessage((prev) => ({
          ...prev,
          [assistantMessage.id]: 'planner',
        }));
      } else if (response.mode === 'research' || response.subagent_data?.researcher) {
        setActiveTabPerMessage((prev) => ({
          ...prev,
          [assistantMessage.id]: 'researcher',
        }));
      } else if (response.mode === 'openui') {
        setActiveTabPerMessage((prev) => ({
          ...prev,
          [assistantMessage.id]: 'openui',
        }));
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: generateClientMessageId('err'),
        role: 'assistant',
        content: `Error generating response: ${err.message || 'Sub-agent communication failure.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
      setIsEvaluating(false);
    }
  };

  // Computed filtered items for slash/mentions autocomplete
  const filteredSkills = AVAILABLE_SLASH_SKILLS.filter(
    (s) =>
      s.command.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      s.badge.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      (p.primary_language || '').toLowerCase().includes(mentionQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredIdeas = ideas.filter(
    (i) =>
      (i.title || '').toLowerCase().includes(mentionQuery.toLowerCase()) ||
      (i.elevator_pitch || '').toLowerCase().includes(mentionQuery.toLowerCase()) ||
      (i.target_tech_stack || '').toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);

    // Match if user is currently typing a trigger character (/, @, #) at cursor
    const match = textBeforeCursor.match(/(?:^|\s)([\/@#])([a-zA-Z0-9_\-\.]*)$/);
    if (match) {
      const trigger = match[1] as '/' | '@' | '#';
      const query = match[2] || '';
      setMentionTrigger(trigger);
      setMentionQuery(query);
      setMentionSelectedIndex(0);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionTrigger(null);
      setMentionQuery('');
    }
  };

  const handleInsertMention = (insertedText: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = inputValue.slice(0, cursor);
    const textAfterCursor = inputValue.slice(cursor);

    // Locate the start of the current trigger in textBeforeCursor
    const lastTriggerIdx = textBeforeCursor.search(/(?:^|\s)[/@#][a-zA-Z0-9_\-\.]*$/);
    if (lastTriggerIdx === -1) {
      setInputValue((prev) => `${prev} ${insertedText} `);
      setShowMentions(false);
      return;
    }

    const spaceOffset = textBeforeCursor[lastTriggerIdx] === ' ' || textBeforeCursor[lastTriggerIdx] === '\n' ? 1 : 0;
    const startReplaceIdx = lastTriggerIdx + spaceOffset;

    const newPrefix = inputValue.slice(0, startReplaceIdx) + insertedText + ' ';
    const newFullText = newPrefix + textAfterCursor;

    setInputValue(newFullText);
    setShowMentions(false);
    setMentionTrigger(null);
    setMentionQuery('');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPrefix.length, newPrefix.length);
      }
    }, 10);
  };

  const handleToggleSkill = (skillCmd: string) => {
    setInputValue((prev) => {
      const trimmed = prev.trim();
      if (trimmed.startsWith(skillCmd)) {
        return trimmed.replace(new RegExp(`^\\${skillCmd}\\s*`), '');
      }
      const clean = trimmed.replace(/^\/(?:eval|evaluate|plan|research|audit|openui|stats|pivot|help)\s*/i, '');
      return clean ? `${skillCmd} ${clean}` : `${skillCmd} `;
    });
    textareaRef.current?.focus();
  };

  const handleTriggerMentionPicker = (char: '@' | '#') => {
    setInputValue((prev) => {
      const trimmed = prev.endsWith(' ') || prev.length === 0 ? prev : `${prev} `;
      return `${trimmed}${char}`;
    });
    setMentionTrigger(char);
    setMentionQuery('');
    setMentionSelectedIndex(0);
    setShowMentions(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions) {
      const listCount =
        mentionTrigger === '/'
          ? filteredSkills.length
          : mentionTrigger === '@'
          ? filteredProjects.length
          : filteredIdeas.length;

      if (listCount > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionSelectedIndex((prev) => (prev + 1) % listCount);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionSelectedIndex((prev) => (prev - 1 + listCount) % listCount);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (mentionTrigger === '/') {
            handleInsertMention(filteredSkills[mentionSelectedIndex].command);
          } else if (mentionTrigger === '@') {
            handleInsertMention(`@${filteredProjects[mentionSelectedIndex].name}`);
          } else if (mentionTrigger === '#') {
            handleInsertMention(`#${filteredIdeas[mentionSelectedIndex].title}`);
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowMentions(false);
          return;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSyncKnowledge = async () => {
    setIsSyncingKnowledge(true);
    setSyncMessage(null);
    try {
      const res = await api.syncKnowledgeBase();
      setSyncMessage(`✓ Indexed ${res.points_indexed} vectors in Qdrant`);
      fetchQdrantStatus();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage('Failed to sync knowledge.');
    } finally {
      setIsSyncingKnowledge(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear conversation history for this chat session?')) return;
    setIsClearingHistory(true);
    try {
      await api.clearChatHistory(selectedProjectId || undefined, currentSessionId || undefined);
      setMessages([]);
      fetchSessions(false);
    } catch (err: any) {
      alert(`Failed to clear: ${err.message}`);
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleAddSuggestedFeature = async (
    feature: { title: string; priority: any; description?: string },
    itemKey: string
  ) => {
    if (!selectedProjectId) {
      alert('Please select a project in the top bar to attach this feature to.');
      return;
    }

    try {
      await api.post(`/projects/${selectedProjectId}/features`, {
        title: feature.title,
        priority: feature.priority || 'P1',
        description: feature.description,
      });

      setAddedItemIds((prev) => ({ ...prev, [itemKey]: true }));
    } catch (err: any) {
      alert(`Failed to add feature: ${err.message}`);
    }
  };

  const handleOpenUIAction = async (action: { name: string; params?: any }) => {
    const actName = (action.name || '').toLowerCase();
    if (actName.includes('add') || actName.includes('feature') || actName.includes('roadmap')) {
      const title = action.params?.title || 'Interactive OpenUI Feature';
      const priority = action.params?.priority || 'P1';
      await handleAddSuggestedFeature(
        { title, priority, description: 'Added from OpenUI interactive component.' },
        generateClientMessageId('openui')
      );
    } else {
      handleSendMessage(`Execute action: ${action.name} with params ${JSON.stringify(action.params || {})}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(sessionSearchQuery.toLowerCase())
  );

  const starterPrompts = [
    '/eval Automated WhatsApp concept import bot with webhook dispatch',
    'What are my current repository statistics and active features?',
    '/eval Biometric WebAuthn passkeys with hardware fallback architecture',
    'How does the multi-tenant Qdrant RAG pipeline isolate vector search?',
  ];

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content: 100% viewport, zero-page-scroll */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-2 pb-2 flex-1 min-h-0 flex flex-col overflow-hidden relative z-10">
        
        {/* Compact Top Control Bar: Title + Telemetry */}
        <div className="flex items-center justify-between gap-3 pb-2 pt-1 border-b border-neutral-200/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#0047FF] animate-pulse inline-block" />
              <h1 className="text-base sm:text-lg font-black text-neutral-900 uppercase tracking-tight truncate">
                DevCommand Copilot
              </h1>
            </div>
            <span className="hidden sm:inline text-neutral-300">|</span>
            <p className="hidden md:block text-[11px] text-neutral-500 font-mono truncate">
              <strong className="text-[#0047FF] uppercase font-bold">Researcher</strong> &bull; <strong className="text-[#FF5533] uppercase font-bold">Judge</strong> &bull; <strong className="text-neutral-900 uppercase font-bold">Planner</strong> &bull; <strong className="text-purple-600 uppercase font-bold">OpenUI</strong>
            </p>
          </div>

          {/* Telemetry Status Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Qdrant Cloud Badge */}
            <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase shadow-xs ${
              qdrantStatus?.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Database className="w-3 h-3" />
              <span>{qdrantStatus?.connected ? 'QDRANT: ONLINE' : 'CONNECTING'}</span>
              {qdrantStatus?.points_count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px]">
                  {qdrantStatus.points_count}
                </span>
              )}
            </div>

            {/* OpenUI / OUI-1 Status Badge */}
            <div
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase shadow-xs ${
                oui1Status?.connected
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-purple-50 border-purple-200 text-purple-800'
              }`}
              title={oui1Status?.message || 'OpenUI Generative UI with OUI-1 & Cascade'}
            >
              <Sparkles className="w-3 h-3 text-[#0047FF]" />
              <span>{oui1Status?.connected ? 'OUI-1: ACTIVE' : 'OPENUI: CASCADE'}</span>
              <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-white/80 border border-current/20">
                DSL
              </span>
            </div>

            {/* Sync Knowledge Button */}
            <button
              onClick={handleSyncKnowledge}
              disabled={isSyncingKnowledge}
              className="px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] font-mono font-bold uppercase rounded-xl flex items-center gap-1.5 transition shadow-xs active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              title="Index all projects and features into Qdrant Cloud"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingKnowledge ? 'animate-spin text-[#0047FF]' : 'text-neutral-600'}`} />
              <span>{isSyncingKnowledge ? 'SYNCING...' : 'SYNC'}</span>
            </button>

            {syncMessage && (
              <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg animate-fade-in shadow-xs">
                {syncMessage}
              </span>
            )}
          </div>
        </div>

        {/* Multi-Chat 2-Column Split: Flex-1 Min-H-0 Overflow-Hidden */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 mt-2 items-stretch relative overflow-hidden">
          
          {/* Mobile Overlay Backdrop */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
            />
          )}

          {/* Left Sidebar: Multi-Chat Threads Drawer */}
          <aside
            className={`
              fixed lg:static top-0 bottom-0 left-0 z-40 lg:z-10
              w-64 sm:w-72 bg-white border border-neutral-200/90 rounded-2xl
              flex flex-col shadow-lg lg:shadow-xs transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              ${!isSidebarOpen ? 'lg:hidden' : ''}
              p-3 space-y-2.5 shrink-0 h-full min-h-0 overflow-hidden
            `}
          >
            {/* Sidebar Top: Header + New Chat Button */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0047FF]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Conversations
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-neutral-100 rounded-full text-neutral-600">
                  {sessions.length}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 lg:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* "+ New Conversation" Button */}
            <button
              onClick={handleNewChat}
              className="w-full py-2.5 px-3.5 bg-neutral-900 hover:bg-[#0047FF] text-white rounded-xl font-mono text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>New Conversation</span>
            </button>

            {/* Optional search if > 3 sessions */}
            {sessions.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  placeholder="Filter chats..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono bg-neutral-50/80 border border-neutral-200/80 rounded-lg outline-none focus:border-[#0047FF] transition-all"
                />
              </div>
            )}

            {/* Sessions List: flex-1 min-h-0 overflow-y-auto */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingSessions && sessions.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-neutral-400 font-mono text-xs gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0047FF]" />
                  <span>Loading chats...</span>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 px-2 space-y-2">
                  <MessageCircle className="w-8 h-8 text-neutral-300 mx-auto" />
                  <p className="text-xs font-mono text-neutral-500 font-medium">No previous chats.</p>
                  <p className="text-[11px] text-neutral-400">Click &ldquo;New Conversation&rdquo; to start!</p>
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isActive = currentSessionId === s.id;
                  const isEditingThis = editingSessionId === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`
                        group relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1
                        ${isActive
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white hover:bg-neutral-50/80 border-neutral-200/70 text-neutral-800 hover:border-neutral-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        {isEditingThis ? (
                          <form
                            onSubmit={(e) => handleSaveRename(s.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 w-full"
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              autoFocus
                              className="w-full text-xs font-medium font-sans bg-white text-neutral-900 px-1.5 py-0.5 rounded border border-[#0047FF] outline-none"
                            />
                            <button
                              type="submit"
                              className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSessionId(null)}
                              className="p-1 hover:bg-rose-100 rounded text-rose-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#DFFF4F]' : 'bg-neutral-300'}`} />
                              <span className="text-xs font-semibold truncate font-sans">
                                {s.title}
                              </span>
                            </div>

                            {/* Hover Actions: Rename & Delete */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(s, e)}
                                className={`p-1 rounded transition-colors ${
                                  isActive ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-200 text-neutral-500'
                                }`}
                                title="Rename chat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSession(s.id, e)}
                                className={`p-1 rounded transition-colors ${
                                  isActive ? 'hover:bg-neutral-800 text-rose-300' : 'hover:bg-rose-100 text-rose-600'
                                }`}
                                title="Delete chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Snippet / Metadata */}
                      {!isEditingThis && (
                        <div className={`flex items-center justify-between text-[10px] font-mono ${
                          isActive ? 'text-neutral-400' : 'text-neutral-400'
                        }`}>
                          <span className="truncate max-w-[170px]">
                            {s.last_message ? s.last_message : new Date(s.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          {s.message_count !== undefined && s.message_count > 0 && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                              isActive ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              {s.message_count} {s.message_count === 1 ? 'msg' : 'msgs'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar User Multi-Tenancy Footer */}
            <div className="pt-2 border-t border-neutral-100 text-[11px] font-mono text-neutral-500 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-700 font-bold truncate">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{user?.full_name || user?.email || 'Authenticated User'}</span>
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#0047FF]" />
                <span>Isolated User Multi-Tenancy</span>
              </div>
            </div>
          </aside>

          {/* Right Main Pane: Active Conversation */}
          <div className="flex-1 min-h-0 flex flex-col min-w-0 space-y-2 h-full overflow-hidden">
            {/* Conversation Active Header */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl px-3.5 py-2 shadow-xs flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition flex items-center gap-1 text-xs font-mono font-bold uppercase cursor-pointer"
                  title={isSidebarOpen ? 'Hide Conversations' : 'Show Conversations'}
                >
                  {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-neutral-500" /> : <PanelLeftOpen className="w-4 h-4 text-[#0047FF]" />}
                  <span className="hidden sm:inline text-neutral-600">{isSidebarOpen ? 'Hide' : 'Chats'}</span>
                </button>

                <div className="h-4 w-px bg-neutral-200" />

                <div className="flex items-center gap-2 truncate">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900 truncate font-sans">
                    {currentSessionTitle}
                  </h2>
                  {currentSessionId && (
                    <button
                      onClick={() => {
                        const target = sessions.find((s) => s.id === currentSessionId);
                        if (target) {
                          handleStartRename(target, { stopPropagation: () => {} } as any);
                        }
                      }}
                      className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-700 transition"
                      title="Rename conversation"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scope & Clear Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Project Scope Selector */}
                <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200/90 rounded-xl px-2.5 py-1 text-xs font-mono font-bold shadow-xs">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#0047FF]" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-transparent text-neutral-900 uppercase outline-none cursor-pointer text-xs font-bold max-w-[140px] sm:max-w-[200px] truncate"
                  >
                    <option value="">🌐 ALL REPOSITORIES</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        📦 {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Chat Button */}
                {messages.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    disabled={isClearingHistory}
                    className="p-1.5 sm:px-2.5 sm:py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1 transition shadow-xs cursor-pointer"
                    title="Clear messages in this chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CLEAR</span>
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Box (Scrollable flex-1 min-h-0) */}
            <div className="flex-1 min-h-0 bg-white border border-neutral-200/90 rounded-2xl p-3 sm:p-5 overflow-y-auto space-y-4 shadow-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-4 px-2 my-auto">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0047FF] to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 mb-2.5 ring-4 ring-blue-50">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight mb-1">
                DevCommand Pair Programmer &amp; Idea Evaluator
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mb-4 leading-relaxed font-sans">
                Chat normally for fast answers and codebase context, or invoke <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">/eval &lt;idea&gt;</span> to run the ruthless 3-sub-agent evaluation swarm.
              </p>

              {/* 3-Pillars Sub-Agent Explainer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-xl mb-4 text-left">
                <div className="rounded-xl p-2.5 bg-neutral-50/80 border border-neutral-200/80 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0047FF] uppercase">
                    <Search className="w-3.5 h-3.5" />
                    <span>Researcher</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Discovers competitors, market gaps, and ecosystem precedents.
                  </p>
                </div>

                <div className="rounded-xl p-2.5 bg-neutral-50/80 border border-neutral-200/80 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5533] uppercase">
                    <Scale className="w-3.5 h-3.5" />
                    <span>The Judge</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Scores viability (0-100), exposes fatal flaws, and advises pivots.
                  </p>
                </div>

                <div className="rounded-xl p-2.5 bg-neutral-50/80 border border-neutral-200/80 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-900 uppercase">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Planner</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Builds actionable architectures with 1-click roadmap tasks.
                  </p>
                </div>
              </div>

              {/* Starter Prompt Cards */}
              <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-2.5 rounded-xl bg-neutral-50/70 hover:bg-neutral-100 border border-neutral-200/80 text-[11px] text-neutral-800 font-sans font-medium flex items-center justify-between group transition-all shadow-xs hover:border-neutral-300 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span className="line-clamp-1 leading-relaxed">{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0047FF] group-hover:translate-x-1 shrink-0 ml-1.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const subData = msg.subagent_data;
              const hasSubAgents = subData && subData.is_pipeline;
              const activeTab = activeTabPerMessage[msg.id] || (subData?.openui_lang || msg.openui_lang ? 'openui' : 'judge');
              const plannerSubTab = plannerSubTabPerMessage[msg.id] || 'pivot';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Header label */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 font-medium px-1">
                    <span>{msg.role === 'user' ? 'YOU' : (hasSubAgents ? 'COPILOT SWARM' : 'DEVCOMMAND AI')}</span>
                    <span>&bull;</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.tier_used && <span className="text-[#0047FF] font-semibold">[{msg.tier_used}]</span>}
                  </div>

                  {/* Message Body */}
                  <div
                    className={`${
                      msg.role === 'user'
                        ? 'rounded-2xl rounded-tr-xs bg-neutral-900 text-white p-4 sm:p-5 shadow-xs max-w-2xl border border-neutral-800'
                        : 'rounded-2xl rounded-tl-xs bg-neutral-50/70 border border-neutral-200/80 p-5 sm:p-6 w-full max-w-4xl space-y-4 shadow-xs'
                    }`}
                  >
                    {/* User message */}
                    {msg.role === 'user' && (
                      <div className="whitespace-pre-wrap font-sans text-sm font-medium leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {/* Assistant Message */}
                    {msg.role === 'assistant' && (
                      <div className="space-y-4">
                        {/* Copy / Actions Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
                          <div className="flex items-center gap-2">
                            {hasSubAgents && subData.judge ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#DFFF4F]/90 text-neutral-900 border border-amber-300 rounded-full">
                                <Bot className="w-3.5 h-3.5 text-black" />
                                <span>3 Sub-Agents Executed (/eval)</span>
                              </div>
                            ) : subData?.planner ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-amber-50 text-amber-900 border border-amber-300 rounded-full">
                                <Layers className="w-3.5 h-3.5 text-amber-600" />
                                <span>Feature Planner (/plan)</span>
                              </div>
                            ) : subData?.researcher ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-blue-50 text-blue-900 border border-blue-300 rounded-full">
                                <Search className="w-3.5 h-3.5 text-[#0047FF]" />
                                <span>Market Scout (/research)</span>
                              </div>
                            ) : subData?.auditor ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-rose-50 text-rose-900 border border-rose-300 rounded-full">
                                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                                <span>Security Auditor (/audit)</span>
                              </div>
                            ) : msg.mode === 'stats' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-full">
                                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Workspace Telemetry (/stats)</span>
                              </div>
                            ) : msg.mode === 'openui' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-purple-50 text-purple-900 border border-purple-300 rounded-full">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                <span>Generative UI (/openui)</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-white text-neutral-700 border border-neutral-200 rounded-full">
                                Conversational Copilot
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-mono font-medium px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-neutral-200 transition cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* SUB-AGENT PIPELINE CARD */}
                        {hasSubAgents && subData.judge && (
                          <div className="space-y-4">
                            {/* 1. Executive Verdict Banner */}
                            <div className="p-4 sm:p-5 rounded-xl bg-neutral-900 text-white border border-neutral-800 shadow-sm space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                                <div>
                                  <div className="text-[10px] font-mono text-[#DFFF4F] uppercase tracking-widest font-bold">
                                    THE JUDGE SUB-AGENT VERDICT
                                  </div>
                                  <div className="text-base font-bold tracking-tight mt-0.5 text-white uppercase">
                                    {subData.judge.verdict_title || 'Feature Viability Rating'}
                                  </div>
                                </div>

                                {/* Score Gauge & Signal Badge */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right font-mono">
                                    <span className="text-2xl font-bold text-white num-tabular">{subData.judge.score}</span>
                                    <span className="text-xs text-neutral-400">/100</span>
                                  </div>
                                  <div
                                    className={`px-3 py-1 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-full ${
                                      subData.judge.verdict_signal === 'BUILD_NOW'
                                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/20'
                                        : subData.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                        ? 'bg-amber-400 text-black'
                                        : 'bg-[#FF5533] text-white'
                                    }`}
                                  >
                                    <span>{subData.judge.verdict_signal.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                                {subData.judge.summary_verdict}
                              </p>
                            </div>

                            {/* 2. Sub-Agent Interactive Tabs */}
                            <div className="flex items-center gap-1 p-1 bg-neutral-200/60 rounded-xl border border-neutral-300/50">
                              {/* Tab 1: The Judge */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'judge' }))}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                  activeTab === 'judge'
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5 text-[#FF5533]" />
                                <span>1. The Judge</span>
                              </button>

                              {/* Tab 2: Market Researcher */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'researcher' }))}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                  activeTab === 'researcher'
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                                }`}
                              >
                                <Search className="w-3.5 h-3.5 text-[#0047FF]" />
                                <span>2. Researcher</span>
                              </button>

                              {/* Tab 3: Feature Planner */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'planner' }))}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                  activeTab === 'planner'
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5 text-amber-500" />
                                <span>3. Feature Planner</span>
                              </button>

                              {/* Tab 4: OpenUI Interactive UI */}
                              {(subData.openui_lang || msg.openui_lang || (subData.is_pipeline && subData.judge)) && (
                                <button
                                  onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'openui' }))}
                                  className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                    activeTab === 'openui'
                                      ? 'bg-neutral-900 text-white shadow-xs'
                                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-white/50'
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#DFFF4F]" />
                                  <span>4. Interactive UI</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#DFFF4F] text-black">
                                    OUI-1
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Tab Content 1: The Judge */}
                            {activeTab === 'judge' && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-4 bg-white rounded-xl border border-neutral-200/90 space-y-1.5 shadow-xs">
                                  <div className="font-mono text-neutral-800 uppercase tracking-wider text-[11px] font-bold">
                                    Unvarnished Assessment
                                  </div>
                                  <p className="text-neutral-700 leading-relaxed font-sans text-xs">
                                    {subData.judge.brutal_critique}
                                  </p>
                                </div>

                                {/* Strengths vs Fatal Flaws */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Fatal Flaws */}
                                  <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-2 shadow-xs">
                                    <div className="font-bold text-rose-800 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Fatal Flaws &amp; Risks</span>
                                    </div>
                                    <ul className="space-y-1.5 text-neutral-800 font-sans text-xs">
                                      {(subData.judge.failure_modes || []).map((flaw, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-rose-500 font-bold">&bull;</span>
                                          <span>{flaw}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* What To Build Instead */}
                                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2 shadow-xs">
                                    <div className="font-bold text-[#0047FF] flex items-center gap-1.5 font-mono text-[11px] uppercase">
                                      <Zap className="w-3.5 h-3.5 text-[#0047FF]" />
                                      <span>Smart Alternative Proposal</span>
                                    </div>
                                    <p className="text-neutral-800 leading-relaxed font-sans text-xs">
                                      {subData.judge.what_to_build_instead || 'Focus on the simplest verifiable MVP slice first.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab Content 2: Market Researcher */}
                            {activeTab === 'researcher' && subData.researcher && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-5 bg-white rounded-xl border border-neutral-200/90 leading-relaxed whitespace-pre-wrap font-sans text-xs text-neutral-800 shadow-xs">
                                  {subData.researcher.content}
                                </div>
                              </div>
                            )}

                            {/* Tab Content 3: Feature Planner */}
                            {activeTab === 'planner' && subData.planner && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                {subData.pivot_plan && (
                                  <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'pivot' }))}
                                      className={`flex-1 py-1.5 px-3 font-bold font-mono text-[11px] uppercase rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                        plannerSubTab === 'pivot'
                                          ? 'bg-white text-neutral-900 shadow-xs'
                                          : 'text-neutral-500 hover:text-neutral-900'
                                      }`}
                                    >
                                      <Target className="w-3.5 h-3.5 text-[#0047FF]" />
                                      <span>Recommended Pivot Plan</span>
                                    </button>
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'original' }))}
                                      className={`flex-1 py-1.5 px-3 font-bold font-mono text-[11px] uppercase rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                        plannerSubTab === 'original'
                                          ? 'bg-white text-neutral-900 shadow-xs'
                                          : 'text-neutral-500 hover:text-neutral-900'
                                      }`}
                                    >
                                      <span>Original Pitch Draft</span>
                                    </button>
                                  </div>
                                )}

                                {/* Blueprint Content */}
                                <div className="p-5 bg-white rounded-xl border border-neutral-200/90 leading-relaxed whitespace-pre-wrap font-mono text-xs text-neutral-800 shadow-xs">
                                  {subData.pivot_plan && plannerSubTab === 'pivot'
                                    ? subData.pivot_plan.content
                                    : subData.planner.content}
                                </div>

                                {/* 1-Click Feature Roadmap Additions */}
                                {((subData.pivot_plan && plannerSubTab === 'pivot'
                                  ? subData.pivot_plan.suggested_features
                                  : subData.planner.suggested_features) || []).length > 0 && (
                                  <div className="pt-2 space-y-2">
                                    <div className="font-mono font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-[#0047FF]" />
                                      <span>1-Click Add to Project Roadmap</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {(subData.pivot_plan && plannerSubTab === 'pivot'
                                        ? subData.pivot_plan.suggested_features
                                        : subData.planner.suggested_features
                                      ).map((feat, idx) => {
                                        const itemKey = `feat-${msg.id}-${plannerSubTab}-${idx}`;
                                        const isAdded = addedItemIds[itemKey];
                                        return (
                                          <div
                                            key={idx}
                                            className="p-3.5 bg-white rounded-xl border border-neutral-200/90 hover:border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all"
                                          >
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-900 text-white rounded-md uppercase">
                                                  {feat.priority}
                                                </span>
                                                <span className="font-bold text-neutral-900 text-xs">{feat.title}</span>
                                              </div>
                                              <p className="text-[11px] text-neutral-500 leading-normal font-mono">
                                                {feat.description}
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => handleAddSuggestedFeature(feat, itemKey)}
                                              disabled={isAdded}
                                              className={`px-3.5 py-1.5 text-xs font-bold font-mono uppercase shrink-0 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                                                isAdded
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                  : 'bg-neutral-900 hover:bg-[#0047FF] text-white shadow-xs active:translate-y-0.5'
                                              }`}
                                            >
                                              {isAdded ? (
                                                <>
                                                  <Check className="w-3.5 h-3.5" />
                                                  <span>Added</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Plus className="w-3.5 h-3.5" />
                                                  <span>Add to Roadmap</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tab Content 4: OpenUI Interactive UI */}
                            {activeTab === 'openui' && (subData.openui_lang || msg.openui_lang || (subData.is_pipeline && subData.judge)) && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <OpenUIRenderer
                                  content=""
                                  openuiLang={
                                    subData.openui_lang ||
                                    msg.openui_lang ||
                                    generateFallbackOpenUIFromJudge(subData, msg)
                                  }
                                  onAction={handleOpenUIAction}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Conversational & Specialized Output with OpenUI Generative UI */}
                        {(!hasSubAgents || !subData.judge) && (
                          <div className="space-y-4">
                            <OpenUIRenderer
                              content={msg.content}
                              openuiLang={msg.openui_lang || subData?.openui_lang}
                              onAction={handleOpenUIAction}
                            />

                            {/* Standalone /plan 1-Click Feature Roadmap Additions */}
                            {subData?.planner?.suggested_features && subData.planner.suggested_features.length > 0 && (
                              <div className="pt-2 space-y-2">
                                <div className="font-mono font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-[#0047FF]" />
                                  <span>1-Click Add to Project Roadmap</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {subData.planner.suggested_features.map((feat: any, idx: number) => {
                                    const itemKey = `standalone-feat-${msg.id}-${idx}`;
                                    const isAdded = addedItemIds[itemKey];
                                    return (
                                      <div
                                        key={idx}
                                        className="p-3.5 bg-white rounded-xl border border-neutral-200/90 hover:border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-900 text-white rounded-md uppercase">
                                              {feat.priority || 'P1'}
                                            </span>
                                            <span className="font-bold text-neutral-900 text-xs">{feat.title}</span>
                                          </div>
                                          <p className="text-[11px] text-neutral-500 leading-normal font-mono">
                                            {feat.description}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleAddSuggestedFeature(feat, itemKey)}
                                          disabled={isAdded}
                                          className={`px-3.5 py-1.5 text-xs font-bold font-mono uppercase shrink-0 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                                            isAdded
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                              : 'bg-neutral-900 hover:bg-[#0047FF] text-white shadow-xs active:translate-y-0.5'
                                          }`}
                                        >
                                          {isAdded ? (
                                            <>
                                              <Check className="w-3.5 h-3.5" />
                                              <span>Added</span>
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-3.5 h-3.5" />
                                              <span>Add to Roadmap</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grounded RAG Citations Bar */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-neutral-200/70 flex items-center gap-2 flex-wrap text-[11px] font-mono text-neutral-500 font-bold uppercase">
                            <div className="flex items-center gap-1 text-neutral-700">
                              <Database className="w-3 h-3 text-[#0047FF]" />
                              <span>Qdrant Vectors:</span>
                            </div>
                            {msg.citations.map((cite, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-neutral-800 flex items-center gap-1.5 shadow-xs"
                              >
                                <span className="text-neutral-400">[{cite.entity_type || 'code'}]</span>
                                <span>{cite.title}</span>
                                <span className="text-[#0047FF] font-bold">
                                  {(cite.score * 100).toFixed(0)}%
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Submitting Status / Stepper Indicator */}
          {isSubmitting && (
            <div className="flex items-start space-y-2 animate-fade-in w-full max-w-2xl">
              <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-sm w-full space-y-3.5">
                {isEvaluating ? (
                  <>
                    <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 text-xs font-mono font-bold uppercase">
                      <div className="flex items-center gap-2 text-neutral-900">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0047FF]" />
                        <span>ORCHESTRATING 3-STAGE EVALUATION SWARM (/eval)</span>
                      </div>
                      <span className="text-neutral-400 font-medium">Pipeline Active</span>
                    </div>

                    {/* Animated 4-Stage Stepper */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] font-bold uppercase">
                      <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                        activeStep >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                      }`}>
                        {activeStep >= 1 ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" />}
                        <span className="truncate">1. Context</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                        activeStep >= 2 ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                      }`}>
                        <Search className="w-3.5 h-3.5 shrink-0 text-[#0047FF]" />
                        <span className="truncate">2. Researcher</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                        activeStep >= 3 ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                      }`}>
                        <Scale className="w-3.5 h-3.5 shrink-0 text-[#FF5533]" />
                        <span className="truncate">3. Judge</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                        activeStep >= 4 ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                      }`}>
                        <Layers className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span className="truncate">4. Planner</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-neutral-500 pt-0.5">
                      {activeStep === 1 && 'Querying Qdrant Cloud vectors for user repository codebase context...'}
                      {activeStep === 2 && 'Market Researcher Sub-Agent is discovering competitors and evaluating feasibility...'}
                      {activeStep === 3 && 'The Judge Sub-Agent is calculating feature score, brutal critique, and fatal flaws...'}
                      {activeStep >= 4 && 'Feature Planner Sub-Agent is drafting architecture blueprint and roadmap tasks...'}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 py-1 font-mono text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0047FF]" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 uppercase">DevCommand Copilot</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded border border-neutral-200">Conversational Mode</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-normal">Synthesizing answer with Qdrant Cloud vector context &amp; codebase intelligence...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Input Box & Autocomplete Popover (Pinned shrink-0 dock) */}
        <div className="relative bg-white border border-neutral-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2 shrink-0">
          {/* Floating Autocomplete Popover */}
          {showMentions && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200/90 shadow-2xl overflow-hidden z-30 max-h-72 flex flex-col animate-fade-in">
              {/* Popover Header */}
              <div className="px-3.5 py-2 bg-neutral-100/90 border-b border-neutral-200/80 flex items-center justify-between text-xs font-mono font-bold uppercase">
                <div className="flex items-center gap-2">
                  {mentionTrigger === '/' && (
                    <>
                      <span className="w-5 h-5 rounded-md bg-neutral-900 text-[#DFFF4F] flex items-center justify-center font-bold text-xs">/</span>
                      <span className="text-neutral-900">Slash Skills</span>
                      <span className="text-neutral-400 font-normal">({filteredSkills.length} available)</span>
                    </>
                  )}
                  {mentionTrigger === '@' && (
                    <>
                      <span className="w-5 h-5 rounded-md bg-[#0047FF] text-white flex items-center justify-center font-bold text-xs">@</span>
                      <span className="text-neutral-900">Tag Project Repository</span>
                      <span className="text-neutral-400 font-normal">({filteredProjects.length} repos)</span>
                    </>
                  )}
                  {mentionTrigger === '#' && (
                    <>
                      <span className="w-5 h-5 rounded-md bg-amber-500 text-black flex items-center justify-center font-bold text-xs">#</span>
                      <span className="text-neutral-900">Tag Incubator Idea</span>
                      <span className="text-neutral-400 font-normal">({filteredIdeas.length} ideas)</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 font-mono font-normal">↑↓ navigate &bull; Enter to select &bull; Esc to dismiss</span>
              </div>

              {/* Popover Item List */}
              <div className="overflow-y-auto p-1.5 space-y-1 divide-y divide-neutral-100/50">
                {mentionTrigger === '/' && (
                  filteredSkills.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-neutral-400">No matching slash skills found.</div>
                  ) : (
                    filteredSkills.map((skill, idx) => {
                      const Icon = skill.icon;
                      const isSelected = idx === mentionSelectedIndex;
                      return (
                        <button
                          key={skill.command}
                          type="button"
                          onClick={() => handleInsertMention(skill.command)}
                          onMouseEnter={() => setMentionSelectedIndex(idx)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white shadow-xs'
                              : 'hover:bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-neutral-800 text-[#DFFF4F]' : 'bg-neutral-100 text-neutral-700'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold text-xs ${isSelected ? 'text-[#DFFF4F]' : 'text-neutral-900'}`}>{skill.command}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isSelected ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                              }`}>
                                {skill.badge}
                              </span>
                              <span className="text-xs font-semibold truncate opacity-90">{skill.name}</span>
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {skill.description}
                            </p>
                          </div>
                          <span className={`text-[10px] font-mono font-medium shrink-0 pt-0.5 ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                            {skill.syntax}
                          </span>
                        </button>
                      );
                    })
                  )
                )}

                {mentionTrigger === '@' && (
                  filteredProjects.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-neutral-400">No matching projects found.</div>
                  ) : (
                    filteredProjects.map((proj, idx) => {
                      const isSelected = idx === mentionSelectedIndex;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => handleInsertMention(`@${proj.name}`)}
                          onMouseEnter={() => setMentionSelectedIndex(idx)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white shadow-xs'
                              : 'hover:bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-neutral-800 text-blue-300' : 'bg-blue-50 text-[#0047FF]'}`}>
                              <FolderGit2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-neutral-900'}`}>@{proj.name}</span>
                                {proj.primary_language && (
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                    isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {proj.primary_language}
                                  </span>
                                )}
                              </div>
                              {proj.description && (
                                <p className={`text-[11px] truncate max-w-md ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                  {proj.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`text-[11px] font-mono shrink-0 font-bold ${isSelected ? 'text-emerald-400' : 'text-neutral-400'}`}>
                            {proj.project_type || 'PRODUCTION'}
                          </span>
                        </button>
                      );
                    })
                  )
                )}

                {mentionTrigger === '#' && (
                  filteredIdeas.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-neutral-400">No matching incubator ideas found.</div>
                  ) : (
                    filteredIdeas.map((idea, idx) => {
                      const isSelected = idx === mentionSelectedIndex;
                      return (
                        <button
                          key={idea.id}
                          type="button"
                          onClick={() => handleInsertMention(`#${idea.title}`)}
                          onMouseEnter={() => setMentionSelectedIndex(idx)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white shadow-xs'
                              : 'hover:bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-neutral-800 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
                              <Zap className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-neutral-900'}`}>#{idea.title}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isSelected ? 'bg-neutral-800 text-amber-400' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {idea.priority || 'P1'}
                                </span>
                              </div>
                              {(idea.elevator_pitch || idea.target_tech_stack) && (
                                <p className={`text-[11px] truncate max-w-md ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                  {idea.elevator_pitch || idea.target_tech_stack}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono shrink-0 uppercase ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                            {idea.status || 'IDEA'}
                          </span>
                        </button>
                      );
                    })
                  )
                )}
              </div>
            </div>
          )}

          {/* Quick Prompts, Skills & Mentions Dock */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleSkill('/eval')}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  inputValue.trim().startsWith('/eval')
                    ? 'bg-neutral-900 text-[#DFFF4F] border-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="/eval: 3-subagent evaluation swarm (Researcher + Judge + Planner)"
              >
                <Scale className="w-3 h-3 text-[#FF5533]" />
                <span>/eval</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSkill('/plan')}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  inputValue.trim().startsWith('/plan')
                    ? 'bg-neutral-900 text-amber-300 border-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="/plan: Technical architecture and 1-click roadmap tasks"
              >
                <Layers className="w-3 h-3 text-amber-500" />
                <span>/plan</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSkill('/research')}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  inputValue.trim().startsWith('/research')
                    ? 'bg-neutral-900 text-blue-300 border-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="/research: Competitor benchmarks and OSS library scout"
              >
                <Search className="w-3 h-3 text-[#0047FF]" />
                <span>/research</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSkill('/audit')}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  inputValue.trim().startsWith('/audit')
                    ? 'bg-neutral-900 text-rose-300 border-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="/audit: Security, OWASP, IDOR, and database audit"
              >
                <ShieldCheck className="w-3 h-3 text-rose-600" />
                <span>/audit</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSkill('/openui')}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  inputValue.trim().startsWith('/openui')
                    ? 'bg-neutral-900 text-purple-300 border-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="/openui: Interactive UI DSL generator"
              >
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>/openui</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSkill('/stats')}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  inputValue.trim().startsWith('/stats')
                    ? 'bg-neutral-900 text-emerald-300 border-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="/stats: Repository metrics and telemetry"
              >
                <Activity className="w-3 h-3 text-emerald-600" />
                <span>/stats</span>
              </button>

              <div className="h-3.5 w-px bg-neutral-300 mx-0.5" />

              <button
                type="button"
                onClick={() => handleTriggerMentionPicker('@')}
                className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                title="Mention a connected project/repo to inject context"
              >
                <AtSign className="w-3 h-3 text-[#0047FF]" />
                <span>@project</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerMentionPicker('#')}
                className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                title="Mention an incubator idea to inject context"
              >
                <Hash className="w-3 h-3 text-amber-600" />
                <span>#idea</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold shrink-0 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-[#0047FF]" /> Starters:
              </span>
              {starterPrompts.slice(0, 2).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(prompt)}
                  className="px-2 py-0.5 bg-neutral-100 hover:bg-[#DFFF4F]/70 text-neutral-700 hover:text-black rounded-full border border-neutral-200/70 text-[10px] font-mono font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer max-w-[200px] truncate"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area & Submit */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, or use /eval, /plan, /audit, @project, #idea..."
              className="flex-1 bg-neutral-50/70 border border-neutral-200/90 rounded-xl text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm font-sans p-2.5 sm:p-3 outline-none focus:bg-white focus:border-[#0047FF] focus:ring-2 focus:ring-[#0047FF]/10 transition-all resize-none leading-relaxed max-h-24"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSubmitting || !inputValue.trim()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-neutral-900 hover:bg-[#0047FF] text-white flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-xs active:translate-y-0.5 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
            <span>Enter to send &bull; Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-neutral-600 font-bold uppercase">
              <ShieldCheck className="w-3 h-3 text-[#0047FF]" />
              <span className="hidden sm:inline">MongoDB Cloud History &amp; Qdrant Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
);
}
