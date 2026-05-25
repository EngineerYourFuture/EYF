import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

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

const CATEGORY_META: Record<string, { icon: string; color: string; glow: string; label: string }> = {
  creational: { icon: 'add_box',      color: '#60a5fa', glow: 'rgba(96,165,250,0.15)',  label: 'Creational' },
  structural:  { icon: 'account_tree', color: '#4ade80', glow: 'rgba(74,222,128,0.15)',  label: 'Structural'  },
  behavioral:  { icon: 'swap_horiz',   color: '#c084fc', glow: 'rgba(192,132,252,0.15)', label: 'Behavioral'  },
};

const SOLID_META: Record<string, { color: string; tagline: string }> = {
  S: { color: '#f87171', tagline: 'Single Responsibility' },
  O: { color: '#fb923c', tagline: 'Open / Closed' },
  L: { color: '#facc15', tagline: 'Liskov Substitution' },
  I: { color: '#4ade80', tagline: 'Interface Segregation' },
  D: { color: '#60a5fa', tagline: 'Dependency Inversion' },
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

const PATTERN_CODE: Record<string, string> = {
  singleton: `// Singleton — one instance, global access point
class Database {
  private static instance: Database | null = null;
  private constructor(private url: string) {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database(process.env.DB_URL!);
    }
    return Database.instance;
  }

  query(sql: string) { /* ... */ }
}

// Usage
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true — same instance`,

  'factory-method': `// Factory Method — subclasses decide which object to create
abstract class Notifier {
  abstract createChannel(): NotificationChannel;

  notify(message: string): void {
    const channel = this.createChannel();
    channel.send(message);
  }
}

class EmailNotifier extends Notifier {
  createChannel() { return new EmailChannel(); }
}
class SMSNotifier extends Notifier {
  createChannel() { return new SMSChannel(); }
}

// Usage — callers work with Notifier, not the concrete channel
const notifier: Notifier = new EmailNotifier();
notifier.notify('Your OTP is 123456');`,

  observer: `// Observer — publish/subscribe decoupling
interface Observer { update(event: string, data: unknown): void }

class EventBus {
  private listeners = new Map<string, Observer[]>();

  subscribe(event: string, observer: Observer) {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...list, observer]);
  }

  publish(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((o) => o.update(event, data));
  }
}

// Usage
const bus = new EventBus();
bus.subscribe('user:login', { update: (_, d) => console.log('Audit:', d) });
bus.publish('user:login', { userId: '42', ip: '1.2.3.4' });`,

  strategy: `// Strategy — swap algorithms at runtime
interface SortStrategy {
  sort(data: number[]): number[];
}

class QuickSort implements SortStrategy {
  sort(data: number[]) { return [...data].sort((a, b) => a - b); }
}
class BubbleSort implements SortStrategy {
  sort(data: number[]) {
    const arr = [...data];
    for (let i = 0; i < arr.length; i++)
      for (let j = 0; j < arr.length - i - 1; j++)
        if (arr[j]! > arr[j + 1]!) [arr[j], arr[j + 1]] = [arr[j + 1]!, arr[j]!];
    return arr;
  }
}

class Sorter {
  constructor(private strategy: SortStrategy) {}
  setStrategy(s: SortStrategy) { this.strategy = s; }
  sort(data: number[]) { return this.strategy.sort(data); }
}

const sorter = new Sorter(new QuickSort());
console.log(sorter.sort([3, 1, 4, 1, 5])); // [1, 1, 3, 4, 5]`,

  decorator: `// Decorator — add behaviour without subclassing
interface Coffee { cost(): number; description(): string }

class Espresso implements Coffee {
  cost() { return 2.5; }
  description() { return 'Espresso'; }
}

class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  cost() { return this.coffee.cost() + 0.5; }
  description() { return this.coffee.description() + ', Milk'; }
}

class SyrupDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  cost() { return this.coffee.cost() + 0.75; }
  description() { return this.coffee.description() + ', Syrup'; }
}

// Usage — compose at runtime
let drink: Coffee = new Espresso();
drink = new MilkDecorator(drink);
drink = new SyrupDecorator(drink);
console.log(drink.description()); // Espresso, Milk, Syrup
console.log(drink.cost());        // 3.75`,

  'abstract-factory': `// Abstract Factory — families of related objects
interface Button { render(): void }
interface Checkbox { render(): void }

interface UIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

class MacButton implements Button { render() { console.log('Mac button'); } }
class MacCheckbox implements Checkbox { render() { console.log('Mac checkbox'); } }

class WinButton implements Button { render() { console.log('Win button'); } }
class WinCheckbox implements Checkbox { render() { console.log('Win checkbox'); } }

class MacFactory implements UIFactory {
  createButton(): Button { return new MacButton(); }
  createCheckbox(): Checkbox { return new MacCheckbox(); }
}
class WinFactory implements UIFactory {
  createButton(): Button { return new WinButton(); }
  createCheckbox(): Checkbox { return new WinCheckbox(); }
}

// Usage — swap entire UI family without touching client code
function renderUI(factory: UIFactory) {
  factory.createButton().render();
  factory.createCheckbox().render();
}
renderUI(new MacFactory()); // Mac button / Mac checkbox
renderUI(new WinFactory()); // Win button / Win checkbox`,

  builder: `// Builder — step-by-step complex object construction
class QueryBuilder {
  private table = '';
  private conditions: string[] = [];
  private columns = '*';
  private limitVal?: number;

  from(table: string) { this.table = table; return this; }
  select(...cols: string[]) { this.columns = cols.join(', '); return this; }
  where(condition: string) { this.conditions.push(condition); return this; }
  limit(n: number) { this.limitVal = n; return this; }

  build(): string {
    let sql = \`SELECT \${this.columns} FROM \${this.table}\`;
    if (this.conditions.length) sql += \` WHERE \${this.conditions.join(' AND ')}\`;
    if (this.limitVal) sql += \` LIMIT \${this.limitVal}\`;
    return sql;
  }
}

// Usage — fluent API, no telescoping constructors
const query = new QueryBuilder()
  .from('users')
  .select('id', 'name', 'email')
  .where('active = true')
  .where('plan = "pro"')
  .limit(10)
  .build();
console.log(query);
// SELECT id, name, email FROM users WHERE active = true AND plan = "pro" LIMIT 10`,

  prototype: `// Prototype — clone instead of construct
interface Cloneable<T> { clone(): T }

class UserProfile implements Cloneable<UserProfile> {
  constructor(
    public name: string,
    public permissions: string[],
    public settings: Record<string, unknown>
  ) {}

  clone(): UserProfile {
    return new UserProfile(
      this.name,
      [...this.permissions],          // deep copy array
      { ...this.settings }            // shallow copy settings
    );
  }
}

// Usage — clone a base template, then tweak
const adminTemplate = new UserProfile('Admin', ['read', 'write', 'delete'], { theme: 'dark' });

const alice = adminTemplate.clone();
alice.name = 'Alice';
alice.permissions.push('billing');

console.log(adminTemplate.name);         // Admin (untouched)
console.log(alice.permissions.length);   // 4`,

  adapter: `// Adapter — bridge incompatible interfaces
// Third-party library uses a different interface
class LegacyPaymentGateway {
  processPayment(amountCents: number, currency: string): boolean {
    console.log(\`Legacy: paying \${amountCents} \${currency} cents\`);
    return true;
  }
}

// What our app expects
interface PaymentProcessor {
  pay(amount: number): Promise<boolean>;
}

// Adapter wraps legacy, exposes modern interface
class PaymentAdapter implements PaymentProcessor {
  constructor(private legacy: LegacyPaymentGateway, private currency = 'USD') {}

  async pay(amount: number): Promise<boolean> {
    const cents = Math.round(amount * 100);
    return this.legacy.processPayment(cents, this.currency);
  }
}

// Usage — our code never touches the legacy API directly
const processor: PaymentProcessor = new PaymentAdapter(new LegacyPaymentGateway());
await processor.pay(29.99); // Legacy: paying 2999 USD cents`,

  bridge: `// Bridge — separate abstraction from implementation
interface Renderer {
  renderCircle(x: number, y: number, r: number): void;
}

class SVGRenderer implements Renderer {
  renderCircle(x: number, y: number, r: number) {
    console.log(\`<circle cx="\${x}" cy="\${y}" r="\${r}" />\`);
  }
}
class CanvasRenderer implements Renderer {
  renderCircle(x: number, y: number, r: number) {
    console.log(\`ctx.arc(\${x}, \${y}, \${r}, 0, 2 * Math.PI)\`);
  }
}

// Abstraction hierarchy is independent of renderer
abstract class Shape {
  constructor(protected renderer: Renderer) {}
  abstract draw(): void;
}

class Circle extends Shape {
  constructor(private x: number, private y: number, private r: number, renderer: Renderer) {
    super(renderer);
  }
  draw() { this.renderer.renderCircle(this.x, this.y, this.r); }
}

// Swap renderer without changing Circle
new Circle(50, 50, 20, new SVGRenderer()).draw();  // SVG output
new Circle(50, 50, 20, new CanvasRenderer()).draw(); // Canvas output`,

  composite: `// Composite — tree of uniform components
interface FileSystemItem {
  name: string;
  size(): number;
  print(indent?: string): void;
}

class File implements FileSystemItem {
  constructor(public name: string, private _size: number) {}
  size() { return this._size; }
  print(indent = '') { console.log(\`\${indent}📄 \${this.name} (\${this._size}KB)\`); }
}

class Directory implements FileSystemItem {
  private children: FileSystemItem[] = [];
  constructor(public name: string) {}

  add(item: FileSystemItem) { this.children.push(item); return this; }
  size() { return this.children.reduce((sum, c) => sum + c.size(), 0); }
  print(indent = '') {
    console.log(\`\${indent}📁 \${this.name} (\${this.size()}KB)\`);
    this.children.forEach((c) => c.print(indent + '  '));
  }
}

// Usage — treat files and directories uniformly
const root = new Directory('src')
  .add(new File('index.ts', 2))
  .add(new Directory('components')
    .add(new File('Button.tsx', 5))
    .add(new File('Modal.tsx', 8)));

root.print(); // recursive tree output
console.log(root.size()); // 15`,

  facade: `// Facade — simple interface to a complex subsystem
class Auth { validate(token: string) { return token === 'valid'; } }
class Cache { get(key: string) { return null as unknown; } set(key: string, val: unknown) {} }
class Database { query(sql: string) { return [{ id: 1 }]; } }
class Logger { log(msg: string) { console.log('[LOG]', msg); } }

// Facade hides the subsystem complexity
class UserService {
  private auth = new Auth();
  private cache = new Cache();
  private db = new Database();
  private logger = new Logger();

  getUser(token: string, userId: number) {
    if (!this.auth.validate(token)) throw new Error('Unauthorized');

    const cacheKey = \`user:\${userId}\`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const rows = this.db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
    this.cache.set(cacheKey, rows[0]);
    this.logger.log(\`User \${userId} fetched\`);
    return rows[0];
  }
}

// Caller only knows UserService — subsystem is hidden
const svc = new UserService();
const user = svc.getUser('valid', 1);`,

  flyweight: `// Flyweight — share intrinsic state across many objects
interface TreeType {
  name: string; color: string; texture: string;
  draw(x: number, y: number): void;
}

// Shared flyweight — heavy data
class TreeTypeCache {
  private static types = new Map<string, TreeType>();

  static get(name: string, color: string, texture: string): TreeType {
    const key = \`\${name}-\${color}-\${texture}\`;
    if (!this.types.has(key)) {
      this.types.set(key, {
        name, color, texture,
        draw(x, y) { console.log(\`Draw \${name} at (\${x},\${y})\`); }
      });
    }
    return this.types.get(key)!;
  }
  static count() { return this.types.size; }
}

// Tree stores only extrinsic (unique) state
class Tree {
  constructor(private x: number, private y: number, private type: TreeType) {}
  draw() { this.type.draw(this.x, this.y); }
}

// 1,000,000 trees — only 3 TreeType objects in memory
const forest = Array.from({ length: 1_000_000 }, (_, i) =>
  new Tree(i % 500, i % 300, TreeTypeCache.get('Pine', 'green', 'rough'))
);
console.log(TreeTypeCache.count()); // 1 — shared!`,

  proxy: `// Proxy — controlled access to another object
interface ImageLoader { display(): void }

class RealImage implements ImageLoader {
  constructor(private src: string) {
    console.log(\`Loading heavy image: \${src}\`); // expensive
  }
  display() { console.log(\`Showing: \${this.src}\`); }
}

// Virtual proxy — defers loading until first access
class LazyImage implements ImageLoader {
  private real: RealImage | null = null;
  constructor(private src: string) {}

  display() {
    if (!this.real) this.real = new RealImage(this.src); // load on demand
    this.real.display();
  }
}

// Caching proxy wrapping an expensive API call
class CachedUserProxy {
  private cache = new Map<number, unknown>();
  async getUser(id: number) {
    if (!this.cache.has(id)) {
      const data = await fetch(\`/api/users/\${id}\`).then((r) => r.json());
      this.cache.set(id, data);
    }
    return this.cache.get(id);
  }
}

const img = new LazyImage('hero.jpg'); // not loaded yet
img.display(); // loaded now`,

  'chain-of-responsibility': `// Chain of Responsibility — pass request along handler chain
interface Handler<T> {
  setNext(handler: Handler<T>): Handler<T>;
  handle(request: T): string | null;
}

abstract class BaseHandler<T> implements Handler<T> {
  private nextHandler: Handler<T> | null = null;

  setNext(handler: Handler<T>): Handler<T> {
    this.nextHandler = handler;
    return handler;
  }

  handle(request: T): string | null {
    return this.nextHandler?.handle(request) ?? null;
  }
}

class AuthMiddleware extends BaseHandler<Request> {
  handle(req: Request) {
    if (!req.headers.get('Authorization')) return '401 Unauthorized';
    return super.handle(req);
  }
}
class RateLimiter extends BaseHandler<Request> {
  private hits = 0;
  handle(req: Request) {
    if (++this.hits > 100) return '429 Too Many Requests';
    return super.handle(req);
  }
}
class RouteHandler extends BaseHandler<Request> {
  handle(_req: Request) { return '200 OK'; }
}

// Wire the chain
const auth = new AuthMiddleware();
auth.setNext(new RateLimiter()).setNext(new RouteHandler());`,

  command: `// Command — encapsulate operations as objects
interface Command { execute(): void; undo(): void; }

class TextEditor {
  private text = '';
  insert(str: string) { this.text += str; }
  delete(n: number) { this.text = this.text.slice(0, -n); }
  getText() { return this.text; }
}

class InsertCommand implements Command {
  constructor(private editor: TextEditor, private str: string) {}
  execute() { this.editor.insert(this.str); }
  undo() { this.editor.delete(this.str.length); }
}

class CommandHistory {
  private stack: Command[] = [];

  run(cmd: Command) { cmd.execute(); this.stack.push(cmd); }
  undo() { this.stack.pop()?.undo(); }
}

// Usage
const editor = new TextEditor();
const history = new CommandHistory();

history.run(new InsertCommand(editor, 'Hello'));
history.run(new InsertCommand(editor, ' World'));
console.log(editor.getText()); // Hello World

history.undo();
console.log(editor.getText()); // Hello`,

  iterator: `// Iterator — sequential access without exposing internals
class Range implements Iterable<number> {
  constructor(private start: number, private end: number, private step = 1) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const { end, step } = this;
    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: 0, done: true };
      },
    };
  }
}

// Usage — range works in any iterable context
for (const n of new Range(1, 10, 2)) {
  console.log(n); // 1, 3, 5, 7, 9
}

const evens = [...new Range(0, 20, 2)]; // [0,2,4,...,20]

// Tree in-order iterator
function* inOrder(node: { val: number; left?: typeof node; right?: typeof node }): Generator<number> {
  if (node.left) yield* inOrder(node.left);
  yield node.val;
  if (node.right) yield* inOrder(node.right);
}`,

  mediator: `// Mediator — centralize communication between components
interface ChatMediator {
  send(message: string, sender: User): void;
  addUser(user: User): void;
}

class User {
  constructor(public name: string, private mediator: ChatMediator) {
    mediator.addUser(this);
  }
  send(message: string) { this.mediator.send(message, this); }
  receive(message: string, from: User) {
    console.log(\`[\${this.name}] received from \${from.name}: \${message}\`);
  }
}

class ChatRoom implements ChatMediator {
  private users: User[] = [];
  addUser(user: User) { this.users.push(user); }
  send(message: string, sender: User) {
    this.users.filter((u) => u !== sender).forEach((u) => u.receive(message, sender));
  }
}

// Users communicate through mediator, not directly
const room = new ChatRoom();
const alice = new User('Alice', room);
const bob   = new User('Bob',   room);
const carol = new User('Carol', room);

alice.send('Hello everyone!');
// [Bob] received from Alice: Hello everyone!
// [Carol] received from Alice: Hello everyone!`,

  memento: `// Memento — snapshot & restore object state
class EditorMemento {
  constructor(
    public readonly content: string,
    public readonly cursor: number,
    public readonly timestamp = Date.now()
  ) {}
}

class TextEditor {
  private content = '';
  private cursor = 0;

  type(text: string) {
    this.content = this.content.slice(0, this.cursor) + text + this.content.slice(this.cursor);
    this.cursor += text.length;
  }

  save(): EditorMemento { return new EditorMemento(this.content, this.cursor); }

  restore(m: EditorMemento) {
    this.content = m.content;
    this.cursor = m.cursor;
  }

  getContent() { return this.content; }
}

// Undo/redo stack
const editor = new TextEditor();
const history: EditorMemento[] = [];

editor.type('Hello');
history.push(editor.save());
editor.type(' World');
history.push(editor.save());
editor.type('!!!');

console.log(editor.getContent()); // Hello World!!!
editor.restore(history[0]!);
console.log(editor.getContent()); // Hello`,

  state: `// State — behaviour changes with internal state
interface TrafficLightState {
  next(): TrafficLightState;
  signal(): string;
  duration(): number;
}

class Red implements TrafficLightState {
  next() { return new Green(); }
  signal() { return '🔴 STOP'; }
  duration() { return 30; }
}
class Green implements TrafficLightState {
  next() { return new Yellow(); }
  signal() { return '🟢 GO'; }
  duration() { return 25; }
}
class Yellow implements TrafficLightState {
  next() { return new Red(); }
  signal() { return '🟡 SLOW'; }
  duration() { return 5; }
}

class TrafficLight {
  private state: TrafficLightState = new Red();

  tick() {
    console.log(\`\${this.state.signal()} for \${this.state.duration()}s\`);
    this.state = this.state.next();
  }
}

const light = new TrafficLight();
light.tick(); // 🔴 STOP for 30s
light.tick(); // 🟢 GO for 25s
light.tick(); // 🟡 SLOW for 5s`,

  'template-method': `// Template Method — define algorithm skeleton, defer steps
abstract class DataMigration {
  // Template method — fixed algorithm skeleton
  run() {
    const data = this.extract();
    const transformed = this.transform(data);
    this.load(transformed);
    this.cleanup();
  }

  protected abstract extract(): Record<string, unknown>[];
  protected abstract transform(data: Record<string, unknown>[]): Record<string, unknown>[];

  protected load(data: Record<string, unknown>[]) {
    console.log(\`Loading \${data.length} records to DB\`);
  }
  protected cleanup() { console.log('Migration complete'); }
}

class UserMigration extends DataMigration {
  protected extract() {
    return [{ id: 1, full_name: 'Alice Smith', created: '2023-01-01' }];
  }
  protected transform(data: Record<string, unknown>[]) {
    return data.map(({ full_name, ...rest }) => ({
      ...rest,
      firstName: (full_name as string).split(' ')[0],
      lastName:  (full_name as string).split(' ')[1],
    }));
  }
}

new UserMigration().run();`,

  visitor: `// Visitor — add operations without modifying element classes
interface ASTNode { accept(visitor: ASTVisitor): void; }

class NumberNode implements ASTNode {
  constructor(public value: number) {}
  accept(v: ASTVisitor) { v.visitNumber(this); }
}
class BinaryOpNode implements ASTNode {
  constructor(public op: '+' | '*', public left: ASTNode, public right: ASTNode) {}
  accept(v: ASTVisitor) { v.visitBinaryOp(this); }
}

interface ASTVisitor {
  visitNumber(n: NumberNode): void;
  visitBinaryOp(n: BinaryOpNode): void;
}

// Add a new operation (evaluator) without touching AST nodes
class Evaluator implements ASTVisitor {
  result = 0;
  visitNumber(n: NumberNode) { this.result = n.value; }
  visitBinaryOp(n: BinaryOpNode) {
    const left = new Evaluator(); n.left.accept(left);
    const right = new Evaluator(); n.right.accept(right);
    this.result = n.op === '+' ? left.result + right.result : left.result * right.result;
  }
}

// (3 + 4) * 2
const ast = new BinaryOpNode('*', new BinaryOpNode('+', new NumberNode(3), new NumberNode(4)), new NumberNode(2));
const ev = new Evaluator(); ast.accept(ev);
console.log(ev.result); // 14`,

  interpreter: `// Interpreter — grammar for a mini-language
interface Expression { interpret(ctx: Record<string, number>): number; }

class NumberExpr implements Expression {
  constructor(private value: number) {}
  interpret() { return this.value; }
}
class VariableExpr implements Expression {
  constructor(private name: string) {}
  interpret(ctx: Record<string, number>) { return ctx[this.name] ?? 0; }
}
class AddExpr implements Expression {
  constructor(private left: Expression, private right: Expression) {}
  interpret(ctx: Record<string, number>) { return this.left.interpret(ctx) + this.right.interpret(ctx); }
}
class MultiplyExpr implements Expression {
  constructor(private left: Expression, private right: Expression) {}
  interpret(ctx: Record<string, number>) { return this.left.interpret(ctx) * this.right.interpret(ctx); }
}

// Build AST for: (x + 5) * y
const expr = new MultiplyExpr(
  new AddExpr(new VariableExpr('x'), new NumberExpr(5)),
  new VariableExpr('y')
);

const context = { x: 3, y: 4 };
console.log(expr.interpret(context)); // (3+5)*4 = 32`,
};

const PATTERN_USE_CASES: Record<string, { when: string[]; avoid: string[]; realWorld: string[] }> = {
  singleton: {
    when: ['Database connection pool', 'Logger / telemetry client', 'Configuration manager', 'Cache manager'],
    avoid: ['Global mutable state (prefer DI)', 'When unit testing (hard to mock)', 'Multi-threaded code without sync'],
    realWorld: ['Prisma Client instance', 'Winston logger', 'Redux store', 'Webpack compiler'],
  },
  'factory-method': {
    when: ['Creating objects whose exact type is unknown ahead of time', 'Frameworks where plugins add new types', 'When subclasses should control object creation'],
    avoid: ['When there\'s only one product type', 'Simple object creation — just use `new`'],
    realWorld: ['React.createElement', 'Express Router', 'ORM Model factories'],
  },
  observer: {
    when: ['Event-driven systems', 'Decoupling publishers from subscribers', 'Real-time UI updates', 'Domain event propagation'],
    avoid: ['When subscribers need guaranteed execution order', 'Synchronous pipelines where callbacks suffice'],
    realWorld: ['EventEmitter (Node.js)', 'RxJS Observables', 'React state / Redux', 'WebSocket handlers'],
  },
  strategy: {
    when: ['Multiple algorithms for the same task', 'Avoiding large if/switch on behavior', 'Runtime algorithm switching'],
    avoid: ['When only one algorithm will ever exist', 'Very simple logic — just a function is enough'],
    realWorld: ['Passport.js authentication strategies', 'Payment gateways (Stripe/Razorpay)', 'Sorting/compression algorithms'],
  },
  decorator: {
    when: ['Adding behaviour without modifying original class', 'Combining features at runtime', 'Cross-cutting concerns (logging, caching, auth)'],
    avoid: ['When you need to inspect the decorator stack', 'Deeply nested decorators become hard to debug'],
    realWorld: ['NestJS @UseGuards(), @Interceptors()', 'Express middleware chain', 'TypeScript decorators (@Injectable)'],
  },
  'abstract-factory': {
    when: ['Creating families of UI components (Mac, Win, Web)', 'Switching between multiple database drivers', 'Platform-independent code that must stay consistent'],
    avoid: ['When products rarely change — adds unnecessary abstraction', 'When you only have one product family'],
    realWorld: ['ORM dialect factories (MySQL vs Postgres)', 'Cross-platform UI kits', 'Dependency injection containers'],
  },
  builder: {
    when: ['Objects with many optional parameters (telescoping constructor smell)', 'Step-by-step construction where order matters', 'Producing different representations from the same code'],
    avoid: ['Simple objects — just use a constructor or object literal', 'When all fields are mandatory'],
    realWorld: ['SQL/ORM query builders', 'HTTP request builders (Axios, fetch wrappers)', 'Document generators (PDF, HTML)'],
  },
  prototype: {
    when: ['Cloning complex objects cheaper than constructing from scratch', 'Avoiding subclasses of an object creator', 'Template objects that get customized per use'],
    avoid: ['When objects are cheap to construct', 'When deep clone semantics are ambiguous'],
    realWorld: ['Redux state copying (spread operator)', 'Cell templates in spreadsheet apps', 'Game character presets'],
  },
  adapter: {
    when: ['Integrating third-party libraries with incompatible interfaces', 'Making legacy code work with new systems', 'Wrapping external APIs behind a stable internal contract'],
    avoid: ['When both interfaces can be changed — just align them directly', 'When the mismatch is too large to bridge cleanly'],
    realWorld: ['Axios adapter for Fetch', 'Stripe SDK wrapped in a PaymentService interface', 'Legacy SOAP services behind REST adapters'],
  },
  bridge: {
    when: ['Avoiding permanent binding between abstraction and implementation', 'Both abstraction and implementation should be extensible by subclassing', 'Sharing an implementation among multiple objects'],
    avoid: ['Simple inheritance hierarchy — bridge adds complexity', 'When abstraction and implementation won\'t vary independently'],
    realWorld: ['Cross-platform rendering (SVG vs Canvas vs WebGL)', 'Database abstraction layers', 'Log handlers (file, console, remote)'],
  },
  composite: {
    when: ['Tree-like data structures (file system, DOM, menus)', 'Clients should treat leaf and composite objects uniformly', 'Recursive part-whole hierarchies'],
    avoid: ['Flat list structures — no nesting needed', 'When operations differ significantly between leaf and composite'],
    realWorld: ['React component tree', 'HTML DOM', 'File system (files + directories)', 'Org chart / menu hierarchy'],
  },
  facade: {
    when: ['Providing a simple interface to a complex subsystem', 'Layering your subsystem — facade as entry point per layer', 'Reducing dependencies between clients and subsystem classes'],
    avoid: ['God object anti-pattern — don\'t put everything in one facade', 'When clients genuinely need low-level access'],
    realWorld: ['Service classes in MVC (UserService hiding db + cache + auth)', 'AWS SDK client classes', 'Third-party SDK wrappers'],
  },
  flyweight: {
    when: ['Huge number of similar objects consuming too much memory', 'Objects share most of their state (intrinsic vs extrinsic)', 'Memory is a bottleneck in the application'],
    avoid: ['When you don\'t have memory problems — premature optimization', 'When most state is unique per instance'],
    realWorld: ['Character rendering in text editors (glyph cache)', 'Game particle systems', 'Icon libraries (shared SVG paths)'],
  },
  proxy: {
    when: ['Lazy initialization of expensive objects', 'Access control / protection proxy', 'Caching proxy, logging proxy, remote proxy'],
    avoid: ['When direct access is sufficient', 'When the indirection degrades performance unacceptably'],
    realWorld: ['JavaScript Proxy object', 'ORM lazy loading relations', 'API rate-limiting middleware', 'Image lazy loading'],
  },
  'chain-of-responsibility': {
    when: ['Multiple handlers may process a request in sequence', 'Handler set should be configurable at runtime', 'Decoupling sender from receiver'],
    avoid: ['When exactly one handler must always process the request', 'Deep chains with no fallback cause silent failures'],
    realWorld: ['Express/Koa/Fastify middleware pipeline', 'DOM event bubbling', 'Logging level hierarchy (ERROR > WARN > INFO)'],
  },
  command: {
    when: ['Undo/redo functionality', 'Queueing, scheduling, or logging operations', 'Parameterizing UI actions (buttons, menus)'],
    avoid: ['Simple one-shot operations — lambdas suffice', 'When undo is not needed and the object is heavyweight'],
    realWorld: ['Text editor undo stacks', 'Redux actions', 'Job queues (BullMQ jobs)', 'GUI menu items'],
  },
  iterator: {
    when: ['Providing a standard way to traverse a collection', 'Hiding the internal representation of an aggregate', 'Supporting multiple traversal strategies on the same collection'],
    avoid: ['When the collection is a simple array — just use a for loop', 'When you need random access — iterators are sequential'],
    realWorld: ['JavaScript Symbol.iterator / generators', 'Cursor-based DB result sets', 'Stream APIs (Node.js Readable)'],
  },
  mediator: {
    when: ['Many-to-many component relationships that are hard to manage', 'Decoupling components so they only talk to a mediator', 'Chat rooms, air traffic control, UI dialog coordination'],
    avoid: ['When only a few objects interact — direct references are simpler', 'God mediator that does too much becomes a bottleneck'],
    realWorld: ['Redux store (components dispatch actions, not call each other)', 'EventBus in Vue/Angular', 'Chat room servers', 'Air traffic control systems'],
  },
  memento: {
    when: ['Undo/redo that requires full state snapshots', 'Checkpointing long-running operations', 'Need to restore state without violating encapsulation'],
    avoid: ['When state is large — snapshots are memory-expensive', 'When only simple fields change — diff-based undo is cheaper'],
    realWorld: ['Text editor history', 'Git commits (snapshots of state)', 'Database transactions (SAVEPOINT / ROLLBACK)', 'Game save states'],
  },
  state: {
    when: ['Object behavior depends on its current state', 'Replacing large if/switch blocks that check state', 'State transitions are complex and need to be explicit'],
    avoid: ['When there are only two states — a boolean flag is fine', 'When state machine has very few transitions'],
    realWorld: ['Traffic light systems', 'Order lifecycle (pending → paid → shipped → delivered)', 'WebSocket connection states', 'UI component lifecycle'],
  },
  'template-method': {
    when: ['Multiple algorithms sharing the same skeleton', 'Avoiding code duplication in subclasses', 'Letting subclasses override specific steps without changing the structure'],
    avoid: ['When the algorithm varies too much — strategy is more flexible', 'Liskov substitution must hold for all subclasses'],
    realWorld: ['ETL pipelines (extract/transform/load skeleton)', 'JUnit test lifecycle (@Before, @After, test)', 'Express route handlers', 'Data serializers'],
  },
  visitor: {
    when: ['Adding new operations to a stable class hierarchy without modifying it', 'Operations need to work across multiple unrelated classes', 'Accumulating state over a composite structure'],
    avoid: ['When the class hierarchy changes frequently — visitor becomes fragile', 'When only one or two operations are needed'],
    realWorld: ['AST traversal in compilers / Babel transforms', 'DOM tree walkers', 'Tax calculation across different product types', 'Report generators'],
  },
  interpreter: {
    when: ['Implementing a simple language or grammar', 'Recurring problems expressible as a language (DSL)', 'SQL, RegEx, template engines, config languages'],
    avoid: ['Complex grammars — use a proper parser generator (ANTLR, PEG.js)', 'Performance-critical paths — interpretation is slow vs compilation'],
    realWorld: ['SQL query parsers', 'Regular expression engines', 'Template engines (Handlebars, Mustache)', 'Calculator and formula evaluators'],
  },
};

interface PatternPanelProps {
  readonly pattern: Pattern;
  readonly onClose: () => void;
  readonly onComplete: (key: string) => void;
}

function PatternPanel({ pattern, onClose, onComplete }: PatternPanelProps) {
  const code = PATTERN_CODE[pattern.patternKey] ?? `// ${pattern.name} pattern\n// Content coming soon...`;
  const useCases = PATTERN_USE_CASES[pattern.patternKey];
  const catMeta = CATEGORY_META[pattern.category] ?? { icon: 'category', color: 'var(--t2)', glow: 'rgba(161,161,170,0.1)', label: pattern.category };
  const isDone = pattern.status === 'completed';
  const [tab, setTab] = useState<'overview' | 'code' | 'usage'>('overview');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div
        role="none"
        style={{ flex: 1, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      />
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ width: '100%', maxWidth: 640, background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.09)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Accent line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${catMeta.color}, transparent)` }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: catMeta.glow, border: `1px solid ${catMeta.color}30`, flexShrink: 0 }}>
            <Icon name={catMeta.icon} size={19} style={{ color: catMeta.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: catMeta.color, marginBottom: 2 }}>{catMeta.label}</p>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pattern.name}</h2>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="close" size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 24px 0', flexShrink: 0 }}>
          {(['overview', 'code', 'usage'] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              whileHover={{ color: '#fff' }}
              style={{
                padding: '7px 16px', borderRadius: 999,
                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em',
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: tab === t ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {t}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'overview' && (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75 }}>{pattern.description}</p>
              {PATTERN_USE_CASES[pattern.patternKey] && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>Common Use Cases</p>
                  {PATTERN_USE_CASES[pattern.patternKey].when.slice(0, 4).map((c) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      <Icon name="check_circle" size={13} style={{ color: '#4ade80', flexShrink: 0, marginTop: 2 }} filled />
                      {c}
                    </div>
                  ))}
                </div>
              )}
              {PATTERN_USE_CASES[pattern.patternKey] && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 12 }}>Real-World Examples</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PATTERN_USE_CASES[pattern.patternKey].realWorld.map((r) => (
                      <span key={r} style={{ background: catMeta.glow, border: `1px solid ${catMeta.color}25`, color: catMeta.color, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'code' && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', height: 420 }}>
              <Editor
                language="typescript"
                value={code}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', padding: { top: 16 } }}
              />
            </div>
          )}

          {tab === 'usage' && useCases && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 12 }}>✓ Use When</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {useCases.when.map((w) => (
                    <div key={w} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      <Icon name="check_circle" size={13} style={{ color: '#4ade80', flexShrink: 0, marginTop: 2 }} filled />
                      {w}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f87171', marginBottom: 12 }}>✗ Avoid When</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {useCases.avoid.map((a) => (
                    <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                      <Icon name="remove_circle" size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} filled />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: catMeta.color, marginBottom: 10 }}>Real World Usage</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {useCases.realWorld.map((r) => (
                    <span key={r} style={{ background: catMeta.glow, border: `1px solid ${catMeta.color}25`, color: catMeta.color, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {isDone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#4ade80', fontWeight: 900, fontSize: 14 }}>
              <Icon name="check_circle" size={18} style={{ color: '#4ade80' }} filled />
              Completed! +50 XP earned
            </div>
          ) : (
            <motion.button
              onClick={() => onComplete(pattern.patternKey)}
              whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(232,33,39,0.35)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #e82127, #c41a1f)',
                border: 'none', borderRadius: 999, padding: '14px 0',
                color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.14em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Icon name="check" size={15} />
              Mark as Complete · +50 XP
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const RESOURCES = [
  { icon: 'menu_book', title: 'UML Diagrams', desc: 'Class, sequence, state, and component diagrams for all 23 patterns', tag: 'Visual' },
  { icon: 'code', title: 'Code Examples', desc: 'Java, Python, TypeScript implementations for every pattern', tag: 'Code' },
  { icon: 'quiz', title: 'Pattern Quiz', desc: 'Identify the right pattern for a given problem scenario', tag: 'Practice' },
  { icon: 'architecture', title: 'Architecture Kata', desc: 'Design real systems using multiple patterns in combination', tag: 'Pro' },
];

export function OOPPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [patterns, setPatterns] = useState<Pattern[]>(STATIC_PATTERNS);
  const [solid, setSolid] = useState<SolidLesson[]>(STATIC_SOLID);
  const [progress, setProgress] = useState<OOPProgress | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

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

  const handleComplete = useCallback((patternKey: string) => {
    if (!session?.accessToken) return;
    apiRequest(`/oop/patterns/${patternKey}/progress`, {
      method: 'POST',
      body: { status: 'completed' },
      token: session.accessToken,
    }).catch(() => {});
    setPatterns((prev) => prev.map((p) => p.patternKey === patternKey ? { ...p, status: 'completed' } : p));
    setProgress((prev) => prev ? { ...prev, completed: prev.completed + 1, pct: Math.round(((prev.completed + 1) / prev.total) * 100) } : prev);
    if (selectedPattern?.patternKey === patternKey) setSelectedPattern((p) => p ? { ...p, status: 'completed' } : p);
    fireXP(50, `${patterns.find((p) => p.patternKey === patternKey)?.name ?? 'Pattern'} mastered!`);
  }, [session?.accessToken, fireXP, patterns, selectedPattern]);

  const filtered = activeCategory === 'all' ? patterns : patterns.filter((p) => p.category === activeCategory);
  const categories = ['all', 'creational', 'structural', 'behavioral'];

  const STATUS_ICON: Record<string, string> = { completed: 'check_circle', in_progress: 'play_circle' };
  const STATUS_COLOR: Record<string, string> = { completed: '#4ade80', in_progress: '#facc15' };
  const statusIcon = (s: string) => STATUS_ICON[s] ?? 'radio_button_unchecked';
  const statusColor = (s: string) => STATUS_COLOR[s] ?? 'rgba(255,255,255,0.25)';

  const pct = progress?.pct ?? 0;

  return (
    <AppShell>
      <AnimatePresence>
        {selectedPattern && (
          <PatternPanel
            pattern={selectedPattern}
            onClose={() => setSelectedPattern(null)}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ paddingTop: 56, paddingBottom: 48 }}
        >
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 8 }}>
            Software Engineering
          </p>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
            background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12,
          }}>
            OOP & PATTERNS.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t2)', fontWeight: 500 }}>
            Master design patterns, SOLID principles, and software architecture.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, marginTop: 40, ...GLASS, borderRadius: 18, overflow: 'hidden', alignSelf: 'flex-start', width: 'fit-content' }}>
            {[
              { label: 'Completed', value: `${progress?.completed ?? 0}/${progress?.total ?? 23}` },
              { label: 'Progress',  value: `${pct}%` },
              { label: 'GoF Total', value: '23' },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                padding: '20px 36px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>{stat.label}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 20, maxWidth: 360 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #c084fc)', borderRadius: 4 }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── SOLID Principles ── */}
        <section style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 20 }}>
            SOLID Principles
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {solid.map((s, i) => {
              const meta = SOLID_META[s.letter] ?? { color: 'var(--t2)', tagline: '' };
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  whileHover={{ borderColor: `${meta.color}25`, boxShadow: `0 8px 28px ${meta.color}18` }}
                  style={{ ...GLASS, borderRadius: 18, padding: 24, cursor: 'default', transition: 'box-shadow 0.25s' }}
                >
                  <div style={{ fontSize: 52, fontWeight: 900, color: meta.color, opacity: 0.18, lineHeight: 1, marginBottom: 14 }}>{s.letter}</div>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: meta.color, marginBottom: 6 }}>{meta.tagline}</p>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.35 }}>{s.title}</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Design Patterns ── */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t3)' }}>
              GoF Design Patterns
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat) => {
                const catColor = cat === 'all' ? '#a1a1aa' : (CATEGORY_META[cat]?.color ?? '#a1a1aa');
                const catGlow = cat === 'all' ? 'rgba(161,161,170,0.12)' : (CATEGORY_META[cat]?.glow ?? 'rgba(161,161,170,0.1)');
                const isActive = activeCategory === cat;
                return (
                  <motion.button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      padding: '6px 16px', borderRadius: 999,
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: isActive ? catGlow : 'transparent',
                      border: isActive ? `1px solid ${catColor}35` : '1px solid rgba(255,255,255,0.07)',
                      color: isActive ? catColor : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {cat}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map((p, i) => {
              const catMeta = CATEGORY_META[p.category] ?? { icon: 'category', color: 'var(--t2)', glow: 'rgba(161,161,170,0.1)', label: p.category };
              const locked = p.planAccess === 'pro' || p.planAccess === 'elite';
              const done = p.status === 'completed';
              return (
                <motion.button
                  type="button"
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ delay: i * 0.03, duration: 0.35 }}
                  whileHover={!locked ? { borderColor: `${catMeta.color}22`, boxShadow: `0 8px 28px ${catMeta.glow}` } : {}}
                  onClick={() => !locked && setSelectedPattern(p)}
                  style={{
                    ...GLASS, borderRadius: 16, padding: 20,
                    textAlign: 'left', cursor: locked ? 'default' : 'pointer',
                    opacity: locked ? 0.6 : 1, transition: 'box-shadow 0.25s',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Icon name={catMeta.icon} size={16} style={{ color: catMeta.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: catMeta.color }}>{catMeta.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {locked && <Icon name="lock" size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />}
                      <Icon name={statusIcon(p.status)} size={17} style={{ color: statusColor(p.status) }} filled={done} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 14 }}>
                    {p.description}
                  </p>
                  {locked ? (
                    <Link to="/plans" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="upgrade" size={12} />Upgrade to access
                      </span>
                    </Link>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: catMeta.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Study Pattern <Icon name="arrow_forward" size={12} />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── Resources ── */}
        <section style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 20 }}>
            Additional Resources
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {RESOURCES.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ borderColor: 'rgba(96,165,250,0.2)', boxShadow: '0 8px 24px rgba(96,165,250,0.1)' }}
                style={{ ...GLASS, borderRadius: 18, padding: 24, cursor: 'pointer', transition: 'box-shadow 0.25s' }}
              >
                <div style={{ width: 40, height: 40, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon name={r.icon} size={19} style={{ color: '#60a5fa' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.title}</h3>
                  {r.tag === 'Pro' && (
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.25)', color: '#ff4d5a', padding: '2px 7px', borderRadius: 999 }}>Pro</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Architecture Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          style={{
            borderRadius: 22, padding: '36px 40px',
            background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(192,132,252,0.08))',
            border: '1px solid rgba(96,165,250,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Software Architecture Patterns</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>MVC, MVP, MVVM, Microservices, Event-Driven, Hexagonal Architecture and more</p>
          </div>
          <Link to="/app/system-design" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(96,165,250,0.2)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
                color: '#60a5fa', fontWeight: 700, padding: '12px 24px', borderRadius: 999,
                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Explore System Design <Icon name="arrow_forward" size={15} />
            </motion.button>
          </Link>
        </motion.div>

      </div>
    </AppShell>
  );
}
