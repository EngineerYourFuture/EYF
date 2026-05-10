import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

export function LandingPage() {
  return (
    <div className="dark min-h-screen bg-surface text-on-surface">
      {/* Floating pill navbar */}
      <header className="bg-[#393939]/40 backdrop-blur-md font-['Inter'] antialiased text-sm tracking-wide uppercase rounded-full sticky top-4 mx-auto w-[95%] max-w-7xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex justify-between items-center px-8 py-3">
        <div className="text-2xl font-black tracking-tighter text-[#E2E2E2]">EYF</div>
        <nav className="hidden md:flex items-center gap-10">
          <a href="#modules" className="text-[#E2E2E2]/60 hover:text-[#E82127] transition-colors duration-300">Modules</a>
          <Link to="/plans" className="text-[#E2E2E2]/60 hover:text-[#E82127] transition-colors duration-300">Plans</Link>
          <Link to="/login" className="text-[#E2E2E2]/60 hover:text-[#E82127] transition-colors duration-300">Profile</Link>
        </nav>
        <Link to="/login">
          <button className="bg-primary-container text-white px-6 py-2 rounded-full font-bold active:scale-95 transition-transform text-xs uppercase tracking-widest">
            Get Started
          </button>
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center justify-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/5 blur-[120px] rounded-full" />
          </div>
          <div className="relative z-10 max-w-5xl px-8 text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-on-surface">
              Engineer Your <span className="text-primary-container">Future.</span>
            </h1>
            <p className="text-on-surface-variant text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Unifying coding excellence, core concepts, and elite career placement into a single high-performance ecosystem.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link to="/login">
                <button className="bg-primary-container text-white px-10 py-4 rounded-full text-lg font-bold shadow-lg shadow-primary-container/20 active:scale-95 transition-transform">
                  Get Started
                </button>
              </Link>
              <Link to="/plans">
                <button className="bg-surface-container-high text-on-surface px-10 py-4 rounded-full text-lg font-bold active:scale-95 transition-transform">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="max-w-7xl mx-auto px-8 py-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { icon: 'school', label: 'Learn', desc: 'Master complexity through editorial-grade content structure.' },
              { icon: 'code', label: 'Practice', desc: 'Surgical precision in coding challenges and real-world scenarios.' },
              { icon: 'monitoring', label: 'Track', desc: 'High-fidelity metrics for every stage of your technical growth.' },
              { icon: 'rocket_launch', label: 'Apply', desc: 'Seamless bridge between your skills and elite placements.' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-start group">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-6 text-primary-container group-hover:bg-primary-container group-hover:text-white transition-all duration-500">
                  <Icon name={item.icon} />
                </div>
                <span className="uppercase tracking-[0.2em] font-bold text-on-surface mb-2 text-sm">{item.label}</span>
                <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum */}
        <section id="modules" className="max-w-7xl mx-auto px-8 py-20">
          <h2 className="text-4xl font-black tracking-tighter mb-16">The Curriculum.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Data Structures & Algos', desc: 'The bedrock of computational thinking. Advanced optimization and logic.' },
              { num: '02', title: 'Core CS Fundamentals', desc: 'OS, DBMS, and System Design patterns used by industry leaders.' },
              { num: '03', title: 'Placement Prep', desc: 'Cracking the interview code with FAANG-level mock scenarios.' },
              { num: '04', title: 'Resume Engineering', desc: 'Build impactful resumes that pass ATS and impress humans.' },
              { num: '05', title: 'Tech Skills', desc: 'Master modern languages, frameworks, and cloud platforms.' },
              { num: '06', title: 'Mentorship', desc: 'Learn from engineers at top-tier companies.' },
            ].map((m) => (
              <div key={m.num} className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-between hover:bg-surface-container transition-colors group">
                <div>
                  <span className="bg-primary-container/10 text-primary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
                    Module {m.num}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{m.title}</h3>
                  <p className="text-on-surface-variant text-sm">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Plans teaser */}
        <section className="max-w-7xl mx-auto px-8 py-20">
          <div className="bg-surface-container rounded-xl p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <h2 className="text-5xl font-black tracking-tighter mb-4">Ready to Engineer?</h2>
              <p className="text-on-surface-variant text-lg mb-10 max-w-xl mx-auto">
                Join thousands of engineers who've accelerated their careers with EYF Platform.
              </p>
              <Link to="/login">
                <button className="bg-primary-container text-white px-12 py-4 rounded-full text-lg font-bold shadow-lg shadow-primary-container/20 active:scale-95 transition-transform">
                  Start for Free
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-outline-variant/20">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-black tracking-tighter text-on-surface">EYF</span>
          <div className="flex gap-8 text-xs text-zinc-500 uppercase tracking-widest font-bold">
            <Link to="/authority/login" className="hover:text-white transition-colors">Authority</Link>
            <Link to="/plans" className="hover:text-white transition-colors">Plans</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">V1.0 Kinetic Noir</span>
        </div>
      </footer>
    </div>
  );
}
