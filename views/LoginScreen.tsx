
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Smartphone, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { User, Role } from '../types';
import { TWO_FA_DEMO_CODE } from '../utils/config';
import LightPillar from '../components/LightPillar/LightPillar';

interface LoginScreenProps {
  users: User[];
  onLogin: (userId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation delay
    setTimeout(() => {
        const user = users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() ||
            (u.username && u.username.toLowerCase() === email.toLowerCase())
        );

        if (user) {
            if (user.status === 'INACTIVE') {
                setError('To konto zostało dezaktywowane. Skontaktuj się z HR.');
                setIsLoading(false);
                return;
            }

            // Check password if stored
            if (user.password && user.password !== password) {
                setError('Nieprawidłowy login lub hasło.');
                setIsLoading(false);
                return;
            }

            // Check for 2FA
            if (user.isTwoFactorEnabled) {
                setUserId(user.id);
                setStep('2FA');
                setIsLoading(false);
            } else {
                onLogin(user.id);
            }
        } else {
            setError('Nieprawidłowy email lub hasło.');
            setIsLoading(false);
        }
    }, 800);
  };

  const handle2FASubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      setTimeout(() => {
          if (twoFactorCode === TWO_FA_DEMO_CODE) {
              if (userId) onLogin(userId);
          } else {
              setError('Błędny kod weryfikacyjny.');
              setIsLoading(false);
          }
      }, 600);
  };

  const DEMO_CREDENTIALS: Partial<Record<Role, string>> = {
    [Role.SUPERADMIN]:     'admin',
    [Role.HR]:             'hr',
    [Role.EMPLOYEE]:       'jan.kowalski',
    [Role.ADVISOR]:        'adam.d',
    [Role.AP_COORDINATOR]: 'koordynator',
    [Role.AP_WORKER]:      'ap.pracownik',
  };

  const selectDemoUser = (role: Role) => {
    const identifier = DEMO_CREDENTIALS[role];
    if (identifier) {
      setEmail(identifier);
      setPassword('123');
      setShowDropdown(false);
    }
  };

  const TICKER = ['🎁 Vouchery','💪 Siłownia','🎬 Kino','✈️ Podróże','🛒 Zakupy','☕ Kawiarnie','🏥 Zdrowie','🎵 Muzyka','🎮 Gaming','🌿 Wellness','💆 Masaże','🚴 Rower'];


  return (
    <>
      <style>{`
        @keyframes ebs-grad {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ebs-up {
          from { opacity:0; transform: translateY(32px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes ebs-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ebs-logo-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ebs-logo-carousel { animation: ebs-logo-scroll 40s linear infinite; }
        .ebs-logo-item {
          display:inline-flex; align-items:center; justify-content:center;
          width:72px; height:72px; margin:0 36px; padding:0;
          border-radius:14px;
          background:#ffffff;
          border:1px solid rgba(255,255,255,0.15);
          flex-shrink:0;
          overflow:hidden;
        }
        .ebs-logo-item img { width:90%; height:90%; object-fit:contain; mix-blend-mode:multiply; }
        @keyframes ebs-ping {
          0%,100% { transform:scale(1); opacity:1; }
          60%     { transform:scale(1.8); opacity:0; }
        }
        @keyframes ebs-spin { to { transform: rotate(360deg); } }
        @keyframes ebs-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .ebs-ticker    { animation: ebs-ticker     28s linear infinite; }
        .ebs-up        { animation: ebs-up 0.7s cubic-bezier(.22,1,.36,1) both; }
        .ebs-spin      { animation: ebs-spin 0.9s linear infinite; }
        .ebs-input {
          width:100%; padding:10px 14px 10px 40px;
          border-radius:12px; font-size:13px; color:#fff; outline:none;
          background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08);
          transition: border-color .2s, box-shadow .2s;
        }
        .ebs-input::placeholder { color: rgba(255,255,255,0.2); }
        .ebs-input:focus {
          border-color: rgba(37,99,235,0.7);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
        }
        .ebs-btn {
          background: linear-gradient(135deg,#1d4ed8 0%,#0891b2 50%,#1d4ed8 100%);
          background-size: 200% auto;
          animation: ebs-grad 3s ease infinite;
          box-shadow: 0 8px 32px rgba(37,99,235,.4);
          transition: transform .2s, box-shadow .2s;
        }
        .ebs-btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 12px 40px rgba(37,99,235,.55); }
        .ebs-btn:active:not(:disabled){ transform: scale(.98); }
        .ebs-btn:disabled { opacity:.5; cursor:not-allowed; }
        .ebs-form-panel {
          position: absolute; right: 0; top: 0;
          height: 100vh; width: 100%;
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          background: transparent;
          overflow-y: auto; z-index: 30;
        }
        @media (min-width: 1024px) {
          .ebs-form-panel {
            width: 42%;
            padding: 32px 24px;
            background: transparent;
          }
        }
        .ebs-demo-btn {
          background: rgba(255,255,255,0.03); border:1.5px solid rgba(255,255,255,0.07);
          border-radius:14px; padding:11px 8px; font-size:12px; font-weight:700;
          color:rgba(255,255,255,0.35); transition: all .2s; width:100%;
        }
        .ebs-demo-btn:hover { background:rgba(37,99,235,0.12); border-color:rgba(37,99,235,.3); color:#93c5fd; transform:scale(1.02); }
        .ebs-2fa-input {
          width:220px; text-align:center; font-size:36px; font-weight:900;
          letter-spacing:.4em; padding:16px 12px; border-radius:16px;
          background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1);
          color:#fff; outline:none; caret-color:#2563eb; transition:border-color .2s,box-shadow .2s;
        }
        .ebs-2fa-input:focus { border-color:rgba(37,99,235,.7); box-shadow:0 0 0 4px rgba(37,99,235,.15); }
      `}</style>

      <div style={{ height:'100vh', position:'relative', background:'#030712', overflow:'hidden' }}>

        {/* ═══════════════════════════════ LOGO CAROUSEL — top bar ═══════════════════════════════ */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:50, overflow:'hidden', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="ebs-logo-carousel" style={{ display:'inline-flex', whiteSpace:'nowrap' }}>
            {[
              '/Allianz.png','/luxmed.png','/orange.png','/generali.png','/PZU.png','/warta.png','/hestia.png','/Signal.png','/unum.png','/vienna%20life.png',
              '/Allianz.png','/luxmed.png','/orange.png','/generali.png','/PZU.png','/warta.png','/hestia.png','/Signal.png','/unum.png','/vienna%20life.png',
              '/Allianz.png','/luxmed.png','/orange.png','/generali.png','/PZU.png','/warta.png','/hestia.png','/Signal.png','/unum.png','/vienna%20life.png',
              '/Allianz.png','/luxmed.png','/orange.png','/generali.png','/PZU.png','/warta.png','/hestia.png','/Signal.png','/unum.png','/vienna%20life.png'
            ].map((src, i) => (
              <div key={i} className="ebs-logo-item">
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════ FULL-SCREEN BRANDING BACKGROUND ═══════════════════════════════ */}
        <div className="hidden lg:flex" style={{ position:'absolute', inset:0, overflow:'hidden', flexDirection:'column' }}>

          {/* LightPillar background */}
          <div style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            <LightPillar
              topColor="#4ae887"
              bottomColor="#2f4fee"
              intensity={0.8}
              rotationSpeed={0.3}
              interactive={false}
              glowAmount={0.003}
              pillarWidth={3}
              pillarHeight={0.4}
              noiseIntensity={0}
              pillarRotation={25}
            />
          </div>
          {/* Center content */}
          <div style={{ position:'absolute', left:0, top:0, width:'58%', bottom:46, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 48px', zIndex:20 }}>

            {/* Logo */}
            <div className="ebs-up" style={{ animationDelay:'.1s', marginBottom:24 }}>
              <img src="/logo.png" alt="Logo" style={{ width:120, height:120, objectFit:'contain', borderRadius:24, filter:'drop-shadow(0 0 36px rgba(37,99,235,.5)) drop-shadow(0 8px 24px rgba(0,0,0,.5))' }}/>
            </div>

            {/* Headline */}
            <div className="ebs-up" style={{ animationDelay:'.2s', textAlign:'center', marginBottom:10 }}>
              <h1 style={{ fontSize:34, fontWeight:900, lineHeight:1, letterSpacing:'-1px', background:'linear-gradient(135deg,#fff 0%,#bfdbfe 40%,#93c5fd 65%,#60a5fa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                BALTIC<br/>BENEFITS<br/>SYSTEM
              </h1>
            </div>

            {/* Badge */}
            <div className="ebs-up" style={{ animationDelay:'.3s', marginBottom:28 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', animation:'ebs-ping 2s ease infinite' }}/>
                <span style={{ color:'#6ee7b7', fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase' }}>by Alces Group · System Aktywny</span>
              </div>
            </div>

            {/* Description */}
            <div className="ebs-up" style={{ animationDelay:'.4s', marginBottom:40, maxWidth:380, textAlign:'center' }}>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:16, lineHeight:1.7, fontWeight:400 }}>
                Twoje <strong style={{ color:'rgba(255,255,255,0.8)', fontWeight:700 }}>benefity pracownicze</strong> w jednym miejscu. Vouchery, zdrowie, rozrywka i tysiące usług.
              </p>
            </div>

            {/* Separator */}
            <div className="ebs-up" style={{ animationDelay:'.45s', width:60, height:1, background:'linear-gradient(90deg,transparent,rgba(37,99,235,.7),transparent)', marginBottom:36 }}/>

            {/* Stats row */}
            <div className="ebs-up" style={{ animationDelay:'.55s', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, width:'100%', maxWidth:360 }}>
              {[['500+','Benefitów'],['98%','Satysfakcji'],['10k+','Użytkowników']].map(([v,l],i)=>(
                <div key={i} style={{ textAlign:'center', padding:'14px 8px', borderRadius:18, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.1 }}>{v}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, marginTop:3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticker bar - moved to bottom of screen */}
        </div>

        {/* ═══════════════════════════════ RIGHT — FORM OVERLAY ═══════════════════════════════ */}
        <div className="ebs-form-panel">
<div style={{ width:'100%', maxWidth:360, position:'relative', zIndex:10 }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden justify-center" style={{ marginBottom:28 }}>
              <img src="/logo.png" alt="Logo" style={{ width:216, height:216, objectFit:'contain', borderRadius:48 }}/>
            </div>

            {/* Card */}
            <div style={{ borderRadius:26, background:'rgba(5,10,22,0.97)', backdropFilter:'blur(24px)', boxShadow:'0 32px 80px rgba(0,0,0,.7), 0 0 120px rgba(37,99,235,.06)', overflow:'visible' }}>

                  {/* Top shimmer line */}
                  <div style={{ height:2, borderRadius:'26px 26px 0 0', background:'linear-gradient(90deg,#2563eb,#0891b2,#10b981,#059669,#0284c7,#2563eb)', backgroundSize:'300% 100%', animation:'ebs-grad 4s ease infinite', overflow:'hidden' }}/>

                  <div style={{ padding:'22px 20px 26px', overflow:'visible', position:'relative' }}>
                    {step === 'CREDENTIALS' && (
                      <div className="ebs-up" style={{ animationDelay:'0s' }}>

                        {/* Header */}
                        <div style={{ marginBottom:28 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', animation:'ebs-ping 2s ease infinite' }}/>
                            <span style={{ color:'#6ee7b7', fontSize:11, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase' }}>Bezpieczne połączenie</span>
                          </div>
                          <h2 style={{ fontSize:24, fontWeight:400, color:'#fff', marginBottom:6, letterSpacing:'-0.5px' }}>Witaj z powrotem</h2>
                          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14 }}>Zaloguj się, żeby sprawdzić swoje benefity.</p>
                        </div>

                        <form onSubmit={handleCredentialsSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                          {/* Email */}
                          <div>
                            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Użytkownik</label>
                            <div style={{ position:'relative' }}>
                              <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)', zIndex:1 }}/>
                              <input
                                type="text" required value={email}
                                onChange={e=>setEmail(e.target.value)}
                                onFocus={()=>setShowDropdown(true)}
                                onBlur={()=>setTimeout(()=>setShowDropdown(false),150)}
                                placeholder="login lub e-mail"
                                className="ebs-input"
                                style={{ paddingRight:44 }}
                              />
                              <button
                                type="button"
                                onMouseDown={(e)=>{e.preventDefault();setShowDropdown(d=>!d);}}
                                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0, display:'flex', alignItems:'center' }}
                              >
                                <ChevronDown size={16} style={{ transition:'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                              </button>
                              {showDropdown && (
                                <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'rgba(10,15,35,0.98)', border:'1.5px solid rgba(37,99,235,0.4)', borderRadius:14, overflow:'hidden', zIndex:100, boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
                                  {[
                                    {label:'Admin (2FA)', role: Role.SUPERADMIN, sub:'admin', color:'#f59e0b'},
                                    {label:'HR Manager', role: Role.HR, sub:'hr', color:'#60a5fa'},
                                    {label:'Pracownik', role: Role.EMPLOYEE, sub:'jan.kowalski', color:'#a78bfa'},
                                    {label:'Sprzedaż', role: Role.ADVISOR, sub:'adam.d', color:'#34d399'},
                                    {label:'Koordynator AP', role: Role.AP_COORDINATOR, sub:'koordynator', color:'#fb923c'},
                                    {label:'Pracownik AP', role: Role.AP_WORKER, sub:'ap.pracownik', color:'#4ade80'}
                                  ].map((item, idx, arr) => (
                                    <button
                                      key={item.role}
                                      type="button"
                                      onMouseDown={(e)=>{e.preventDefault();selectDemoUser(item.role);}}
                                      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', background:'none', border:'none', borderBottom: idx<arr.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor:'pointer', textAlign:'left' as const }}
                                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(37,99,235,0.15)')}
                                      onMouseLeave={e=>(e.currentTarget.style.background='none')}
                                    >
                                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                        <div style={{ width:6, height:6, borderRadius:'50%', background: item.color, flexShrink:0 }}/>
                                        <div>
                                          <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', display:'block' }}>{item.label}</span>
                                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{item.sub} · hasło: 123</span>
                                        </div>
                                      </div>
                                      <ArrowRight size={14} style={{ color:'rgba(255,255,255,0.25)', flexShrink:0 }}/>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                              <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.15em', textTransform:'uppercase' }}>Hasło</label>
                              <a href="#" style={{ fontSize:12, color:'#60a5fa', textDecoration:'none', fontWeight:600 }}>Zapomniałeś?</a>
                            </div>
                            <div style={{ position:'relative' }}>
                              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)' }}/>
                              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••" className="ebs-input" style={{ paddingRight:44 }}/>
                              <button type="button" onClick={()=>setShowPassword(p=>!p)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:0, display:'flex', alignItems:'center' }}>
                                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                              </button>
                            </div>
                          </div>

                          {/* Error */}
                          {error && (
                            <div className="ebs-up" style={{ padding:'12px 16px', borderRadius:14, display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#fca5a5', background:'rgba(244,63,94,0.1)', border:'1.5px solid rgba(244,63,94,0.2)' }}>
                              <AlertCircle size={16} style={{ flexShrink:0 }}/>
                              {error}
                            </div>
                          )}

                          {/* Submit */}
                          <button type="submit" disabled={isLoading} className="ebs-btn" style={{ width:'100%', padding:'12px', borderRadius:14, fontSize:14, fontWeight:900, color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, letterSpacing:'0.02em', marginTop:4 }}>
                            {isLoading ? (
                              <><span className="ebs-spin" style={{ width:18, height:18, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}/> Autoryzacja...</>
                            ) : (
                              <> Zaloguj się <ArrowRight size={18} strokeWidth={3}/> </>
                            )}
                          </button>
                        </form>

                      </div>
                    )}

                    {step === '2FA' && (
                      <div className="ebs-up" style={{ animationDelay:'0s', textAlign:'center' }}>
                        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                          <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,rgba(37,99,235,.2),rgba(8,145,178,.2))', border:'1.5px solid rgba(37,99,235,.3)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                            <Smartphone size={36} color="#60a5fa"/>
                            <div style={{ position:'absolute', top:-6, right:-6, width:22, height:22, background:'linear-gradient(135deg,#10b981,#0891b2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ color:'#fff', fontSize:8, fontWeight:900 }}>2FA</span>
                            </div>
                          </div>
                        </div>
                        <h2 style={{ fontSize:26, fontWeight:900, color:'#fff', marginBottom:8 }}>Weryfikacja 2FA</h2>
                        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, marginBottom:28 }}>Wpisz 6-cyfrowy kod z aplikacji Authenticator.</p>

                        <form onSubmit={handle2FASubmit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
                          <input type="text" maxLength={6} value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value.replace(/\D/g,''))} placeholder="000000" autoFocus className="ebs-2fa-input"/>
                          {error && (
                            <div style={{ width:'100%', padding:'12px 16px', borderRadius:14, fontSize:13, color:'#fca5a5', background:'rgba(244,63,94,0.1)', border:'1.5px solid rgba(244,63,94,0.2)' }}>{error}</div>
                          )}
                          <button type="submit" disabled={twoFactorCode.length!==6||isLoading} className="ebs-btn" style={{ width:'100%', padding:'15px', borderRadius:16, fontSize:15, fontWeight:900, color:'#fff', border:'none', cursor:'pointer' }}>
                            {isLoading?'Weryfikacja...':'Potwierdź tożsamość'}
                          </button>
                        </form>

                        <div style={{ marginTop:16, display:'inline-block', padding:'8px 16px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', fontSize:12, color:'rgba(255,255,255,0.3)' }}>
                          Demo Code: <strong style={{ color:'rgba(255,255,255,0.7)' }}>{TWO_FA_DEMO_CODE}</strong>
                        </div>
                        <button onClick={()=>{setStep('CREDENTIALS');setTwoFactorCode('');setError('');}} style={{ display:'block', margin:'16px auto 0', fontSize:13, color:'#60a5fa', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>
                          ← Wróć do logowania
                        </button>
                      </div>
                    )}
                  </div>
            </div>

            <p style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:11, marginTop:20 }}>
              &copy; {new Date().getFullYear()} Stratton Prime S.A. Wszystkie prawa zastrzeżone.
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════ TICKER — bottom bar ═══════════════════════════════ */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, overflow:'hidden', padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="ebs-ticker" style={{ display:'inline-flex', whiteSpace:'nowrap' }}>
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} style={{ color:'rgba(255,255,255,0.3)', fontSize:12, fontWeight:600, padding:'0 24px', display:'inline-block' }}>{item}</span>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};
