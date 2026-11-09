import SITE_DATA from './siteData';

const { profile, currentPursuit, pivot, clips, navigation } = SITE_DATA;
const pad = (n: number) => String(n).padStart(2, '0');
const socials = Object.entries(profile.socials);

export default function App() {
  return (
    <div className="frame">
      <header className="nav mono">
        <a href="#top" className="id">[ {profile.lastName} / {profile.firstName} ]</a>
        <nav aria-label="Primary">
          <ul>
            {navigation.map((n, i) => (
              <li key={n.id}><a href={`#${n.id}`}>{pad(i + 1)} {n.name}</a></li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="name">
          <div className="mono pad" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <span>///  PROFILE</span>
            <span className="hide-sm">{profile.location} ®</span>
          </div>
          <h1 id="name" className="macro">
            <span className="l1">{profile.firstName}</span>
            <span className="l2">{profile.lastName}</span>
          </h1>
          <div className="lede">
            <p className="role">
              {profile.title}
              <span>&gt;&gt;&gt; {currentPursuit.company}</span>
            </p>
            <p>{profile.tagline}</p>
          </div>
          <dl className="cells four mono">
            <div><dt>Role</dt><dd>CTO</dd></div>
            <div><dt>Company</dt><dd>{currentPursuit.company}</dd></div>
            <div><dt>Base</dt><dd>{profile.location}</dd></div>
            <div><dt>Contact</dt><dd><a href={`mailto:${profile.email}`}>{profile.email}</a></dd></div>
          </dl>
          <div className="stripe" aria-hidden="true" />
        </section>

        <section id="career" aria-labelledby="career-h">
          <div className="section-head">
            <p className="num" aria-hidden="true">01</p>
            <h2 id="career-h" className="macro">Career<br />Arc</h2>
            <div className="meta mono"><span>[ FOUR PHASES ]</span><span className="hide-sm">{currentPursuit.focus}</span></div>
          </div>
          <div className="phases">
            {pivot.map((p) => (
              <article className="phase" key={p.phase}>
                <div className="tag mono"><span>PHASE</span><span>{p.phase} / {pad(pivot.length)}</span></div>
                <div className="n" aria-hidden="true">{p.phase}</div>
                <h3>{p.title}</h3>
                <p className="mono red" style={{ margin: 0 }}>&lt; {p.subtitle} &gt;</p>
                <p>{p.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="writing" aria-labelledby="writing-h">
          <div className="section-head">
            <p className="num" aria-hidden="true">02</p>
            <h2 id="writing-h" className="macro">Selected<br />Writing</h2>
            <div className="meta mono"><span>[ {pad(clips.length)} ENTRIES ]</span><span className="hide-sm">NIEMAN LAB / VOX / OPENNEWS</span></div>
          </div>
          <ol className="index">
            {clips.map((c, i) => (
              <li key={c.url}>
                <a className="row" href={c.url} target="_blank" rel="noopener noreferrer">
                  <data className="idx mono" value={i + 1}>{pad(i + 1)}</data>
                  <span className="src mono">{c.source}</span>
                  <span className="main">
                    <span className="t">{c.title}</span>
                    <span className="s">{c.snippet}</span>
                  </span>
                  <span className="tags mono">{c.tags.map((t) => <span key={t}>{t}</span>)}</span>
                  <span className="arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section id="contact" aria-labelledby="contact-h">
          <div className="section-head">
            <p className="num" aria-hidden="true">03</p>
            <h2 id="contact-h" className="macro">Open<br />Channel</h2>
            <div className="meta mono"><span>[ CONTACT ]</span><span className="hide-sm">&gt;&gt;&gt; CTO ROLES</span></div>
          </div>
          <div className="contact">
            <a className="mail macro" href={`mailto:${profile.email}`}>{profile.email}</a>
            <div className="socials mono">
              {socials.map(([k, url]) => (
                <a key={k} href={url} target="_blank" rel="noopener noreferrer"><span>{k}</span><span aria-hidden="true">↗</span></a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bar mono foot" style={{ borderBottom: 0 }}>
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>REV 2.6 / UNIT D-01</span>
        <span>{profile.location} ™</span>
      </footer>
    </div>
  );
}
