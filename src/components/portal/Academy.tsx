import { useEffect, useState } from 'react';
import { MODS, QUIZ } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../Icon';

const TOTAL = MODS.reduce((s, m) => s + m.lessons.length, 0);

type PassedAttempt = { id: string; score: number; total: number; created_at: string };

export default function Academy({ onCertified }: { onCertified?: () => void }) {
  const { user, profile } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [cur, setCur] = useState<[number, number]>([0, 0]);
  const [passed, setPassed] = useState(false);
  const [passedAttempt, setPassedAttempt] = useState<PassedAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: progress }, { data: attempts }] = await Promise.all([
        supabase.from('academy_progress').select('lesson_key').eq('user_id', user.id),
        supabase
          .from('quiz_attempts')
          .select('id, score, total, created_at')
          .eq('user_id', user.id)
          .eq('passed', true)
          .order('created_at', { ascending: true })
          .limit(1),
      ]);
      if (!active) return;
      const doneSet = new Set((progress ?? []).map((r) => r.lesson_key as string));
      setDone(doneSet);
      const firstPass = (attempts as PassedAttempt[] | null)?.[0] ?? null;
      setPassed(!!firstPass);
      setPassedAttempt(firstPass);
      // Resume at the first incomplete lesson, otherwise the first lesson.
      outer: for (let a = 0; a < MODS.length; a++) {
        for (let b = 0; b < MODS[a].lessons.length; b++) {
          if (!doneSet.has(`${a}-${b}`)) {
            setCur([a, b]);
            break outer;
          }
        }
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const [mi, li] = cur;
  const mod = MODS[mi];
  const lesson = mod.lessons[li];
  const key = `${mi}-${li}`;

  const markDone = async () => {
    setDone((d) => new Set(d).add(key));
    toast('Lesson complete');
    if (!user) return;
    await supabase.from('academy_progress').upsert(
      { user_id: user.id, lesson_key: key },
      { onConflict: 'user_id,lesson_key' }
    );
  };

  const nextLesson = () => {
    let [a, b] = cur;
    b++;
    if (b >= MODS[a].lessons.length) {
      a = (a + 1) % MODS.length;
      b = 0;
    }
    setCur([a, b]);
  };

  const submitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    let s = 0;
    QUIZ.forEach((q, i) => {
      if (answers[i] === q.a) s++;
    });
    setScore(s);
    setChecked(true);
    const didPass = s === QUIZ.length;
    if (user) {
      const { data } = await supabase
        .from('quiz_attempts')
        .insert({ user_id: user.id, score: s, total: QUIZ.length, passed: didPass })
        .select('id, score, total, created_at')
        .single();
      if (didPass && data) {
        setPassed(true);
        setPassedAttempt(data as PassedAttempt);
        toast('Certified. Link and clip library unlocked');
        onCertified?.();
      }
    } else if (didPass) {
      setPassed(true);
      toast('Certified. Link and clip library unlocked');
      onCertified?.();
    }
  };

  const certLot = passedAttempt
    ? `CRA-${new Date(passedAttempt.created_at).getFullYear()}-${passedAttempt.id.slice(0, 8).toUpperCase()}`
    : null;

  if (!loaded) {
    return (
      <section data-panel="academy">
        <div className="ph">
          <div>
            <span className="label">Academy</span>
            <h2 style={{ marginTop: 8 }}>Training</h2>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 24 }}>Loading your progress…</p>
      </section>
    );
  }

  return (
    <section data-panel="academy">
      <div className="ph">
        <div>
          <span className="label">Academy</span>
          <h2 style={{ marginTop: 8 }}>Training</h2>
        </div>
        <span className="mono muted">{done.size} of {TOTAL} lessons complete</span>
      </div>

      <div className="grid g2">
        <div className="modules">
          {MODS.map((m, mIdx) => {
            const c = m.lessons.filter((_, li2) => done.has(`${mIdx}-${li2}`)).length;
            return (
              <div className={`module ${mIdx === mi ? 'open' : ''}`} key={m.n}>
                <button aria-expanded={mIdx === mi} onClick={() => setCur([mIdx, 0])}>
                  <span className="mn">{m.n}</span>
                  <span>
                    <span className="mt">{m.t}</span>
                    <span className="meta" style={{ display: 'block' }}>{m.lessons.length} lessons · {c} done</span>
                    <span className="bar"><i style={{ width: `${(c / m.lessons.length) * 100}%` }} /></span>
                  </span>
                  {c === m.lessons.length ? (
                    <span className="st good">Complete</span>
                  ) : m.req ? (
                    <span className="st warn plain">Required</span>
                  ) : null}
                </button>
                <div className="ls">
                  {m.lessons.map((l, lIdx) => {
                    const k = `${mIdx}-${lIdx}`;
                    return (
                      <button
                        key={k}
                        className={`lesson ${done.has(k) ? 'done' : ''} ${mIdx === mi && lIdx === li ? 'cur' : ''}`}
                        onClick={() => setCur([mIdx, lIdx])}
                      >
                        <span className="dot">{done.has(k) && <Icon id="check" strokeWidth={3} style={{ width: 13, height: 13 }} />}</span>
                        <span>{l[0]}</span>
                        <span className="t">{l[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="player">
            <div className="vid">
              <button className="play" aria-label="Play lesson" onClick={() => toast('Lesson video plays here in the live build')}>
                <Icon id="play" strokeWidth={2} style={{ width: 26, height: 26 }} />
              </button>
              <span className="cap">{mod.n} · Lesson {li + 1} · {lesson[1]}</span>
            </div>
            <div className="body">
              <span className="label">{mod.t}</span>
              <h3 style={{ fontSize: 24 }}>{lesson[0]}</h3>
              <ul>{mod.pts.map((p) => <li key={p}>{p}</li>)}</ul>
              <div className="actions">
                <button className={`btn sm ${done.has(key) ? '' : 'solid'}`} onClick={markDone}>
                  {done.has(key) ? <><Icon id="check" strokeWidth={2.4} />Completed</> : 'Mark complete'}
                </button>
                <button className="btn sm" onClick={nextLesson}>Next lesson <Icon id="arrow" /></button>
              </div>
            </div>
          </div>

          <div className="card">
            {passed ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <h3>Compliance check</h3>
                <span className="st good">Passed {passedAttempt?.score ?? QUIZ.length}/{passedAttempt?.total ?? QUIZ.length}</span>
              </div>
            ) : (
              <>
                <span className="label">Module 2 · required</span>
                <h3 style={{ marginTop: 6, fontSize: 22 }}>Compliance check</h3>
                <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>Score 5/5 to unlock your link and the clip library.</p>
                <form onSubmit={submitQuiz}>
                  {QUIZ.map((q, i) => (
                    <div className="q" key={q.q}>
                      <h4>{i + 1}. {q.q}</h4>
                      {q.o.map((o, j) => {
                        const cls = checked && answers[i] === j ? (j === q.a ? 'right' : 'wrong') : '';
                        return (
                          <label className={`opt ${cls}`} key={o}>
                            <input
                              type="radio"
                              name={`q${i}`}
                              checked={answers[i] === j}
                              onChange={() => {
                                setAnswers((a) => ({ ...a, [i]: j }));
                                setChecked(false);
                              }}
                            />
                            <span>{o}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                  <button className="btn solid" type="submit" style={{ marginTop: 8, width: '100%' }}>Check answers</button>
                  {checked && score !== QUIZ.length && (
                    <p className="muted" style={{ fontSize: 13.5, marginTop: 10 }}>{score}/5. Check the highlighted answers and try again.</p>
                  )}
                </form>
              </>
            )}
          </div>

          <div className={`coa ${passed ? '' : 'locked'}`}>
            <header>
              <div>
                <span className="label">Certificate of completion</span>
                <h3>{profile?.full_name ?? 'Creator'}</h3>
              </div>
              <span style={{ color: passed ? 'var(--ice)' : 'var(--slate)' }}>
                {passed ? `Lot ${certLot}` : <><Icon id="lock" strokeWidth={1.8} /> Locked</>}
              </span>
            </header>
            <table>
              <tbody>
                <tr><td>Programme</td><td>CANLAB Creator Academy</td></tr>
                <tr>
                  <td>Compliance check</td>
                  <td className={passed ? 'pass' : ''}>
                    {passed ? `PASS · ${passedAttempt?.score ?? QUIZ.length}/${passedAttempt?.total ?? QUIZ.length}` : 'Pending'}
                  </td>
                </tr>
                <tr><td>Lessons</td><td>{done.size}/{TOTAL}</td></tr>
                <tr><td>Status</td><td className={passed ? 'pass' : ''}>{passed ? 'Certified creator' : 'Not yet certified'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
