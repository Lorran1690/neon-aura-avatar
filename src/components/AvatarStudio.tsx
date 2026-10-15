import { useEffect, useState } from 'react';
import { Activity, AudioLines, Box, BrainCircuit, Check, ChevronDown, Code2, Copy, Eye, Focus, Hand, Heart, Maximize, MessageSquare, Mic, Move3D, Orbit, Pause, Play, RotateCcw, ScanLine, Settings2, Smile, Sparkles, Terminal, Trash2, Wind, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AvatarScene } from './AvatarScene';
import { avatarStore, connectAvatarEvents, executeCommand, emotionLabels, stateLabels, useAvatar, type AIState, type AvatarSettings, type Emotion, type Gesture } from '@/lib/avatar-controller';

function Toggle({ name, field, icon: Icon }: { name: string; field: 'breathing' | 'blinking' | 'headMovement' | 'particles' | 'scanlines' | 'rotation'; icon?: typeof Eye }) {
  const s = useAvatar();
  return <label className="toggle-row"><span className="toggle-name">{Icon && <Icon />}{name}</span><Switch aria-label={name} checked={s[field]} onCheckedChange={value => avatarStore.update({ [field]: value })} /></label>;
}
function Range({ name, field, min, max, step = 1, suffix = '' }: { name: string; field: 'glow' | 'speed' | 'amplitude'; min: number; max: number; step?: number; suffix?: string }) {
  const s = useAvatar();
  return <div><label className="control-label" htmlFor={field}>{name}<span className="control-value">{s[field]}{suffix}</span></label><Slider id={field} aria-label={name} value={[s[field]]} min={min} max={max} step={step} onValueChange={([value]) => { if (value !== undefined) avatarStore.update({ [field]: value }); }} /></div>;
}
function Section({ name, icon: Icon, tag, children }: { name: string; icon: typeof Eye; tag?: string; children: React.ReactNode }) {
  return <section className="panel-section"><div className="section-title"><h2><Icon />{name}</h2>{tag && <span>{tag}</span>}</div>{children}</section>;
}
const stateItems: { state: AIState; command: 'idle' | 'listen' | 'think' | 'speak'; icon: typeof Eye }[] = [
  { state: 'idle', command: 'idle', icon: Orbit }, { state: 'listening', command: 'listen', icon: Mic }, { state: 'thinking', command: 'think', icon: BrainCircuit }, { state: 'speaking', command: 'speak', icon: AudioLines },
];
const gestureItems: { value: Gesture; label: string; icon: typeof Eye }[] = [{ value: 'wave', label: 'Acenar', icon: Hand }, { value: 'talk', label: 'Gesticular', icon: MessageSquare }, { value: 'nod', label: 'Concordar', icon: Smile }, { value: 'rest', label: 'Repouso', icon: Orbit }];
export function AvatarStudio() {
  const s = useAvatar();
  const [tab, setTab] = useState<'studio' | 'animations' | 'integration'>('studio');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const cleanup = connectAvatarEvents();
    avatarStore.log('avatar.ready · interface de eventos ativa');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) avatarStore.update({ rotation: false, headMovement: false, particles: false });
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => { cleanup(); document.removeEventListener('fullscreenchange', onFullscreen); };
  }, []);
  const fullscreenToggle = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.getElementById('avatar-viewport')?.requestFullscreen(); } catch { avatarStore.log('Tela cheia não disponível neste navegador'); }
  };
  const snippet = `// Comandos diretos\nwindow.aura.speak();\nwindow.aura.listen();\nwindow.aura.think();\nwindow.aura.idle();\nwindow.aura.gesture('wave');\nwindow.aura.setEmotion('happy');\n\n// Eventos do navegador\nwindow.dispatchEvent(new CustomEvent('aura:command', {\n  detail: { command: 'gesture', value: 'wave' }\n}));\n\n// postMessage: somente mesma origem\nwindow.postMessage({ type: 'aura:command', command: 'listen' },\n  window.location.origin);\n\n// Observar mudanças\nwindow.addEventListener('aura:state', event => {\n  console.log(event.detail.state);\n});`;
  return <div className="studio">
    <header className="studio-header">
      <div className="brand"><Box className="brand-icon" size={29} strokeWidth={1.4} /><div>AURA<div className="brand-subtitle">HOLOGRAPHIC STUDIO</div></div></div>
      <nav className="nav-tabs" aria-label="Estúdio"><Button variant="ghost" className={`nav-tab ${tab === 'studio' ? 'active' : ''}`} onClick={() => setTab('studio')}>Estúdio</Button><Button variant="ghost" className={`nav-tab ${tab === 'animations' ? 'active' : ''}`} onClick={() => setTab('animations')}>Animações</Button><Button variant="ghost" className={`nav-tab ${tab === 'integration' ? 'active' : ''}`} onClick={() => setTab('integration')}>Integração <Code2 size={13} /></Button></nav>
      <div className="ml-auto flex items-center gap-5"><div className="connection"><span className="status-dot" />Interface pronta</div><span className="header-version text-[10px] text-muted-foreground border border-border px-2 py-1 rounded">v1.0.0</span></div>
    </header>
    <main className="main-wrap">
      <div className="page-heading"><div><h1>{tab === 'integration' ? 'Integração com IA' : tab === 'animations' ? 'Laboratório de animações' : 'Seu avatar, em outra dimensão.'}</h1><p>{tab === 'integration' ? 'Interface de comandos · AURA browser API' : 'Avatar holográfico / AURA-01'}</p></div><Button variant="outline" size="sm" className="text-xs text-muted-foreground" onClick={() => { avatarStore.reset(); avatarStore.log('studio.reset()'); }}><RotateCcw size={13} /><span className="reset-label">Restaurar padrão</span></Button></div>
      <div className={tab === 'integration' ? 'hidden' : 'workspace'}>
        <div>
          <div className="viewport-shell" id="avatar-viewport">
            <div className="scene-canvas"><AvatarScene /></div>
            <div className="viewport-top"><div><div className="tiny-label">LIVE VIEWPORT</div><div className="model-title">AURA-01 <span className="model-chip">HOLOGRÁFICO</span></div></div><div className="live-chip"><span className="status-dot" />LIVE</div></div>
            <div className="viewport-toolbar"><Button variant="ghost" size="icon" className="tool selected" title="Controles de órbita" aria-label="Controles de órbita" onClick={() => avatarStore.update({ rotation: !s.rotation })}><Orbit /></Button><Button variant="ghost" size="icon" className="tool" title="Centralizar avatar" aria-label="Centralizar avatar" onClick={() => avatarStore.update({ cameraReset: s.cameraReset + 1 })}><Focus /></Button><Button variant="ghost" size="icon" className="tool" title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'} aria-label="Tela cheia" onClick={fullscreenToggle}><Maximize /></Button><Button variant="ghost" size="icon" className="tool" title={s.paused ? 'Retomar animações' : 'Pausar animações'} aria-label={s.paused ? 'Retomar animações' : 'Pausar animações'} onClick={() => avatarStore.update({ paused: !s.paused })}>{s.paused ? <Play /> : <Pause />}</Button></div>
            <div className="viewport-bottom"><div><div className="signal-bars">{Array.from({ length: 17 }, (_, i) => <i key={i} />)}</div><div className="avatar-status"><span className="status-dot" /><span>{s.paused ? 'Pausado' : stateLabels[s.state]}</span><span className="text-muted-foreground text-[10px]">· {emotionLabels[s.emotion]}</span></div></div><div className="text-right"><div className="tiny-label">PRESENÇA DIGITAL</div><div className="text-[10px] text-muted-foreground mt-2">R3F / WEBGL 2.0</div></div></div>
          </div>
          <div className="event-console"><div className="console-heading"><strong><Terminal size={13} />Console de eventos <span className="text-muted-foreground ml-2">{s.logs.length}</span></strong><div className="flex items-center gap-3"><span className="text-success text-[9px] flex items-center gap-1.5"><span className="status-dot" />EVENTOS ATIVOS</span><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" title="Limpar console" aria-label="Limpar console" onClick={() => avatarStore.update({ logs: [] })}><Trash2 size={12} /></Button></div></div><div className="console-body" aria-live="polite">{s.logs.length ? s.logs.map(log => <div key={log.id}><time>{log.time}</time><span className="event-text">› {log.text}</span></div>) : <span className="text-muted-foreground">Aguardando eventos…</span>}</div></div>
        </div>
        <aside className="control-panel" aria-label="Painel de controle">
          <Section name="Estado da IA" icon={BrainCircuit} tag="MANUAL"><div className="state-grid">{stateItems.map(({ state, command, icon: Icon }) => <Button key={state} variant="ghost" aria-pressed={s.state === state} className={`state-button ${s.state === state ? 'active' : ''}`} onClick={() => executeCommand({ command })}><Icon size={14} />{stateLabels[state]}{s.state === state && <span className="ml-auto text-primary text-xs">●</span>}</Button>)}</div></Section>
          <Section name="Animações naturais" icon={Activity}><Toggle name="Respiração" field="breathing" icon={Wind} /><Toggle name="Piscar de olhos" field="blinking" icon={Eye} /><Toggle name="Movimento da cabeça" field="headMovement" icon={Move3D} /><Range name="Velocidade" field="speed" min={.25} max={2} step={.05} suffix="×" />{tab === 'animations' && <><Range name="Amplitude" field="amplitude" min={0} max={100} suffix="%" /><Button variant="outline" size="sm" className="mt-5 w-full text-xs" onClick={() => avatarStore.update({ blinkId: s.blinkId + 1 })}><Eye />Testar piscar</Button></>}</Section>
          <Section name="Gestos & expressão" icon={Hand}><div className="gestures">{gestureItems.map(({ value, label, icon: Icon }) => <Button key={value} variant="ghost" className={`gesture-button ${s.gesture === value ? 'active' : ''}`} onClick={() => executeCommand({ command: 'gesture', value })}><Icon size={18} />{label}</Button>)}</div><label className="control-label" htmlFor="emotion">Emoção</label><select className="emotion-select" id="emotion" value={s.emotion} onChange={e => executeCommand({ command: 'setEmotion', value: e.target.value as Emotion })}>{Object.entries(emotionLabels).map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select></Section>
          <Section name="Holograma" icon={Sparkles}><Range name="Intensidade do brilho" field="glow" min={0} max={100} suffix="%" /><div className="mt-4"><Toggle name="Partículas de energia" field="particles" icon={Sparkles} /><Toggle name="Scanlines" field="scanlines" icon={ScanLine} /><Toggle name="Rotação automática" field="rotation" icon={RotateCcw} /></div></Section>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Zap size={12} className="text-primary" />Motor holográfico ativo<span className="ml-auto text-[9px]">AURA ENGINE</span></div>
        </aside>
      </div>
      {tab === 'integration' && <section className="integration"><div className="flex items-center justify-between"><h2>Browser API</h2><Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { avatarStore.log('Cópia indisponível'); } }}>{copied ? <Check /> : <Copy />}{copied ? 'Copiado' : 'Copiar'}</Button></div><pre>{snippet}</pre><h2>Comandos de teste</h2>{stateItems.map(({ state, command }) => <div className="api-command" key={command}><code>window.aura.{command}()</code><Button variant="secondary" size="sm" onClick={() => executeCommand({ command })}><Play size={13} />{stateLabels[state]}</Button></div>)}<h2>Referência</h2><p>Gestos: rest, wave, talk, nod. Emoções: neutral, happy, curious, focused.</p><p>getState() retorna o estado atual. aura:state é emitido após cada mudança. postMessage aceita apenas a mesma origem.</p><p>Interface local de animação: nenhum serviço de IA ou conexão WebSocket está associado.</p></section>}
      <footer className="studio-footer"><span>AURA © 2026 <span className="mx-2">/</span> Holographic Studio</span><span className="flex items-center gap-2"><span className="status-dot" />Todos os sistemas operacionais</span></footer>
    </main>
  </div>;
}