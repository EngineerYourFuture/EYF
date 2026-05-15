import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Pattern {
  id: string;
  patternKey: string;
  name: string;
  category: string;
  description: string;
  planAccess: string;
  status: string;
}

interface SolidLesson {
  id: string;
  principleKey: string;
  letter: string;
  title: string;
  description: string;
}

interface OOPProgress {
  total: number;
  completed: number;
  pct: number;
  categories: Array<{ category: string; total: number; completed: number }>;
}

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  creational: { icon: 'add_box', color: 'text-blue-400', label: 'Creational' },
  structural: { icon: 'account_tree', color: 'text-green-400', label: 'Structural' },
  behavioral: { icon: 'swap_horiz', color: 'text-purple-400', label: 'Behavioral' },
};

const SOLID_META: Record<string, { color: string; tagline: string }> = {
  S: { color: 'text-red-400', tagline: 'Single Responsibility' },
  O: { color: 'text-orange-400', tagline: 'Open / Closed' },
  L: { color: 'text-yellow-400', tagline: 'Liskov Substitution' },
  I: { color: 'text-green-400', tagline: 'Interface Segregation' },
  D: { color: 'text-blue-400', tagline: 'Dependency Inversion' },
};

const STATIC_PATTERNS: Pattern[] = [
  { id: '1', patternKey: 'singleton', name: 'Singleton', category: 'creational', description: 'Ensures a class has only one instance and provides a global access point to it.', planAccess: 'free', status: 'not_started' },
  { id: '2', patternKey: 'factory-method', name: 'Factory Method', category: 'creational', description: 'Defines an interface for creating objects but lets subclasses decide which class to instantiate.', planAccess: 'free', status: 'not_started' },
  { id: '3', patternKey: 'abstract-factory', name: 'Abstract Factory', category: 'creational', description: 'Provides an interface for creating families of related or dependent objects.', planAccess: 'free', status: 'not_started' },
  { id: '4', patternKey: 'builder', name: 'Builder', category: 'creational', description: 'Separates the construction of a complex object from its representation.', planAccess: 'free', status: 'not_started' },
  { id: '5', patternKey: 'prototype', name: 'Prototype', category: 'creational', description: 'Creates new objects by cloning an existing object known as the prototype.', planAccess: 'free', status: 'not_started' },
  { id: '6', patternKey: 'adapter', name: 'Adapter', category: 'structural', description: 'Converts the interface of a class into another interface that clients expect.', planAccess: 'free', status: 'not_started' },
  { id: '7', patternKey: 'bridge', name: 'Bridge', category: 'structural', description: 'Decouples an abstraction from its implementation so both can vary independently.', planAccess: 'free', status: 'not_started' },
  { id: '8', patternKey: 'composite', name: 'Composite', category: 'structural', description: 'Composes objects into tree structures to represent part-whole hierarchies.', planAccess: 'free', status: 'not_started' },
  { id: '9', patternKey: 'decorator', name: 'Decorator', category: 'structural', description: 'Attaches additional responsibilities to an object dynamically.', planAccess: 'free', status: 'not_started' },
  { id: '10', patternKey: 'facade', name: 'Facade', category: 'structural', description: 'Provides a simplified interface to a complex subsystem.', planAccess: 'free', status: 'not_started' },
  { id: '11', patternKey: 'flyweight', name: 'Flyweight', category: 'structural', description: 'Uses sharing to support large numbers of fine-grained objects efficiently.', planAccess: 'pro', status: 'not_started' },
  { id: '12', patternKey: 'proxy', name: 'Proxy', category: 'structural', description: 'Provides a surrogate or placeholder for another object to control access to it.', planAccess: 'free', status: 'not_started' },
  { id: '13', patternKey: 'chain-of-responsibility', name: 'Chain of Responsibility', category: 'behavioral', description: 'Passes a request along a chain of handlers, each deciding to process or forward.', planAccess: 'free', status: 'not_started' },
  { id: '14', patternKey: 'command', name: 'Command', category: 'behavioral', description: 'Encapsulates a request as an object, allowing parameterization and queuing.', planAccess: 'free', status: 'not_started' },
  { id: '15', patternKey: 'iterator', name: 'Iterator', category: 'behavioral', description: 'Provides a way to sequentially access elements of an aggregate object.', planAccess: 'free', status: 'not_started' },
  { id: '16', patternKey: 'mediator', name: 'Mediator', category: 'behavioral', description: 'Defines an object that encapsulates how a set of objects interact.', planAccess: 'pro', status: 'not_started' },
  { id: '17', patternKey: 'memento', name: 'Memento', category: 'behavioral', description: 'Captures and externalizes an object\'s internal state for later restoration.', planAccess: 'pro', status: 'not_started' },
  { id: '18', patternKey: 'observer', name: 'Observer', category: 'behavioral', description: 'Defines a one-to-many dependency so that when one object changes state, dependents are notified.', planAccess: 'free', status: 'not_started' },
  { id: '19', patternKey: 'state', name: 'State', category: 'behavioral', description: 'Allows an object to alter its behavior when its internal state changes.', planAccess: 'free', status: 'not_started' },
  { id: '20', patternKey: 'strategy', name: 'Strategy', category: 'behavioral', description: 'Defines a family of algorithms, encapsulates each one, and makes them interchangeable.', planAccess: 'free', status: 'not_started' },
  { id: '21', patternKey: 'template-method', name: 'Template Method', category: 'behavioral', description: 'Defines the skeleton of an algorithm, deferring some steps to subclasses.', planAccess: 'free', status: 'not_started' },
  { id: '22', patternKey: 'visitor', name: 'Visitor', category: 'behavioral', description: 'Represents an operation to be performed on elements of an object structure.', planAccess: 'pro', status: 'not_started' },
  { id: '23', patternKey: 'interpreter', name: 'Interpreter', category: 'behavioral', description: 'Defines a grammatical representation for a language and provides an interpreter.', planAccess: 'pro', status: 'not_started' },
];

const STATIC_SOLID: SolidLesson[] = [
  { id: 's1', principleKey: 'srp', letter: 'S', title: 'Single Responsibility Principle', description: 'A class should have only one reason to change. Each module or class should have responsibility over a single part of the functionality provided by the software.' },
  { id: 's2', principleKey: 'ocp', letter: 'O', title: 'Open/Closed Principle', description: 'Software entities should be open for extension but closed for modification. You should be able to extend a class\'s behavior without modifying it.' },
  { id: 's3', principleKey: 'lsp', letter: 'L', title: 'Liskov Substitution Principle', description: 'Objects of a superclass should be replaceable with objects of its subclasses without affecting the correctness of the program.' },
  { id: 's4', principleKey: 'isp', letter: 'I', title: 'Interface Segregation Principle', description: 'Clients should not be forced to depend upon interfaces they do not use. Split interfaces into smaller, more specific ones.' },
  { id: 's5', principleKey: 'dip', letter: 'D', title: 'Dependency Inversion Principle', description: 'High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details.' },
];

const RESOURCES = [
  { icon: 'menu_book', title: 'UML Diagrams', desc: 'Class, sequence, state, and component diagrams for all 23 patterns', tag: 'Visual' },
  { icon: 'code', title: 'Code Examples', desc: 'Java, Python, TypeScript implementations for every pattern', tag: 'Code' },
  { icon: 'quiz', title: 'Pattern Quiz', desc: 'Identify the right pattern for a given problem scenario', tag: 'Practice' },
  { icon: 'architecture', title: 'Architecture Kata', desc: 'Design real systems using multiple patterns in combination', tag: 'Pro' },
];

export function OOPPage() {
  const session = getSession();
  const [patterns, setPatterns] = useState<Pattern[]>(STATIC_PATTERNS);
  const [solid, setSolid] = useState<SolidLesson[]>(STATIC_SOLID);
  const [progress, setProgress] = useState<OOPProgress | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ patterns: Pattern[] }>('/oop/patterns', { token: session.accessToken })
      .then((d) => setPatterns(d.patterns))
      .catch(() => {});
    apiRequest<{ lessons: SolidLesson[] }>('/oop/solid', { token: session.accessToken })
      .then((d) => { if (d.lessons.length > 0) setSolid(d.lessons); })
      .catch(() => {});
    apiRequest<OOPProgress>('/oop/progress', { token: session.accessToken })
      .then(setProgress)
      .catch(() => {});
  }, [session?.accessToken]);

  const filtered = activeCategory === 'all' ? patterns : patterns.filter((p) => p.category === activeCategory);
  const categories = ['all', 'creational', 'structural', 'behavioral'];

  const statusIcon = (s: string) =>
    s === 'completed' ? 'check_circle' : s === 'in_progress' ? 'play_circle' : 'radio_button_unchecked';
  const statusColor = (s: string) =>
    s === 'completed' ? 'text-green-400' : s === 'in_progress' ? 'text-yellow-400' : 'text-zinc-600';

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-12 p-10 bg-surface-container rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Icon name="account_tree" className="text-blue-400" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-on-surface">OOP & Software Engineering</h1>
                  <p className="text-on-surface-variant text-sm mt-0.5">Master design patterns, SOLID principles, and software architecture</p>
                </div>
              </div>
              <div className="flex gap-6 mt-8">
                <div>
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Patterns</p>
                  <p className="text-2xl font-bold">{progress?.completed ?? 0}<span className="text-zinc-500 text-base font-normal">/{progress?.total ?? 23}</span></p>
                </div>
                <div className="border-l border-outline-variant/20 pl-6">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Progress</p>
                  <p className="text-2xl font-bold">{progress?.pct ?? 0}<span className="text-zinc-500 text-base font-normal">%</span></p>
                </div>
                <div className="border-l border-outline-variant/20 pl-6">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">GoF Patterns</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="bg-surface-container-high rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-zinc-400">Overall Progress</span>
                  <span className="text-xs text-blue-400">{progress?.pct ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${progress?.pct ?? 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SOLID Principles */}
        <section className="mb-12">
          <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-6 ml-1">
            SOLID Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {solid.map((s) => {
              const meta = SOLID_META[s.letter] ?? { color: 'text-zinc-400', tagline: '' };
              return (
                <div key={s.id} className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors group cursor-pointer">
                  <div className={`text-5xl font-black mb-4 ${meta.color} opacity-20 group-hover:opacity-40 transition-opacity`}>{s.letter}</div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${meta.color}`}>{meta.tagline}</p>
                  <h3 className="text-sm font-bold text-on-surface mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{s.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Design Patterns */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 ml-1">
              GoF Design Patterns
            </h2>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-container-high border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const catMeta = CATEGORY_META[p.category] ?? { icon: 'category', color: 'text-zinc-400', label: p.category };
              const locked = p.planAccess === 'pro' || p.planAccess === 'elite';
              return (
                <div key={p.id} className={`bg-surface-container rounded-xl p-6 transition-all group ${locked ? 'opacity-70' : 'hover:bg-surface-container-high'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name={catMeta.icon} className={catMeta.color} size={18} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${catMeta.color}`}>{catMeta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {locked && <Icon name="lock" className="text-zinc-600" size={14} />}
                      <Icon name={statusIcon(p.status)} className={statusColor(p.status)} size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-on-surface mb-2">{p.name}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{p.description}</p>
                  {locked ? (
                    <Link to="/plans">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary-container flex items-center gap-1">
                        <Icon name="upgrade" size={12} />Upgrade to access
                      </span>
                    </Link>
                  ) : (
                    <button className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      Study Pattern <Icon name="arrow_forward" size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Resources */}
        <section className="mb-12">
          <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-6 ml-1">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RESOURCES.map((r) => (
              <div key={r.title} className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors group cursor-pointer">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name={r.icon} className="text-blue-400" size={20} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold">{r.title}</h3>
                  {r.tag === 'Pro' && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full">Pro</span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Patterns Banner */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 flex items-center justify-between flex-wrap gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Software Architecture Patterns</h3>
            <p className="text-on-surface-variant text-sm">MVC, MVP, MVVM, Microservices, Event-Driven, Hexagonal Architecture and more</p>
          </div>
          <Link to="/app/system-design">
            <button className="bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 font-bold py-3 px-6 rounded-full text-sm transition-all flex items-center gap-2">
              Explore System Design <Icon name="arrow_forward" size={16} />
            </button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
