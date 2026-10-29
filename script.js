// Reveal once 15% of the element is on screen, or once it fills 15% of the screen
// (blocks taller than the screen can never reach 15% of their own height on a phone).
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting&&(e.intersectionRatio>=0.15||e.intersectionRect.height>=window.innerHeight*0.15)){
      e.target.classList.add('visible');
      e.target.querySelectorAll('[data-target]').forEach(animateCounter);
    }
  });
},{threshold:[0,0.05,0.1,0.15]});
document.querySelectorAll('.fade-up').forEach(el=>observer.observe(el));

const impactObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)document.querySelectorAll('[data-target]').forEach(animateCounter);});
},{threshold:0.3});
const ib=document.getElementById('impact-bar');
if(ib)impactObs.observe(ib);

function animateCounter(el){
  if(el.dataset.animated)return;
  el.dataset.animated='true';
  const target=parseInt(el.dataset.target);
  const duration=1600;
  const start=performance.now();
  function step(now){
    const p=Math.min((now-start)/duration,1);
    const e=1-Math.pow(1-p,3);
    el.textContent=Math.floor(e*target)+(p>=1?'+':'');
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ================== AWARD NOMINATIONS ==================
   Each "Nominate" link opens a WhatsApp chat with this number, with a nomination form already typed in. */
const NOMINATION_WHATSAPP='256746279441';
function nominationLink(category){
  const text=['Hello PJF, I would like to submit a nomination for the Peace Journalism Awards.','',
    'Category: '+(category||''),
    "Nominee's name: ",
    'Media house / organisation: ',
    'Link to the nominated work: ',
    'Why it deserves the award: ','',
    'My name and contact: '].join('\n');
  return 'https://wa.me/'+NOMINATION_WHATSAPP+'?text='+encodeURIComponent(text);
}
document.querySelectorAll('[data-award]').forEach(a=>{a.href=nominationLink(a.dataset.award);});


function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDateLabel(dateStr){
  if(!dateStr)return'';
  const d=new Date(dateStr);
  if(isNaN(d))return dateStr;
  return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
}

/* ================== SOCIAL MEDIA ==================
   One entry per account. `icon` picks the logo and brand colour, `platform` names the site,
   `short` (optional) replaces the platform name in the narrow sidebar when one platform has two accounts.
   An empty url shows "Link coming soon". The Social Media page, the sidebar and the footer all read from this list. */
const SOCIAL_LINKS=[
  {icon:'youtube',platform:'YouTube',name:'Voices of Peace PJF',short:'Voices of Peace',url:'https://www.youtube.com/@VoicesofPeacePJF',blurb:'Videos, interviews and documentaries from our peace journalism work.'},
  {icon:'x',platform:'X (Twitter)',name:'@pjfeastafrica',url:'https://x.com/pjfeastafrica',blurb:'Quick updates, breaking stories and conversations on peace and media.'},
  {icon:'facebook',platform:'Facebook',name:'Peace Journalism Foundation',url:'https://www.facebook.com/share/r/183iTn64gK/',blurb:'Community stories, event photos and training highlights.'},
  {icon:'instagram',platform:'Instagram',name:'@pjf.eastafrica',short:'PJF Instagram',url:'https://www.instagram.com/pjf.eastafrica/',blurb:'Photos and short videos from our trainings, events and field work.'},
  {icon:'instagram',platform:'Instagram',name:'Poets for Peace',short:'Poets for Peace',url:'https://www.instagram.com/poetsforpeace.eastafrica/',blurb:'Poetry and creative voices for peace from East Africa.'},
  {icon:'blog',platform:'Blog',name:'Our Blog',url:'https://pjfeastafrica.wordpress.com/',blurb:'In-depth stories and features from journalists across East Africa.'},
  {icon:'bluesky',platform:'Bluesky',name:'@peace-journalism',url:'https://bsky.app/profile/peace-journalism.bsky.social',blurb:'Follow our reporting and join the discussion on Bluesky.'},
  {icon:'whatsapp',platform:'WhatsApp',name:'PJF East Africa Channel',url:'https://whatsapp.com/channel/0029VbDb5pLB4hdTN9N7Af22',blurb:'Follow our WhatsApp channel to get our updates on your phone.'}
];
const SOCIAL_ICONS={
  youtube:'<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
  x:'<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
  facebook:'<path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>',
  linkedin:'<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
  instagram:'<path fill-rule="evenodd" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.5-3.7a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/>',
  blog:'<path d="M4 2h12l4 4v16H4V2zm2 2v16h12V7h-3V4H6zm2 5h8v2H8V9zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>',
  bluesky:'<path d="M5.202 2.805C7.954 4.747 10.913 8.686 12 10.8c1.087-2.114 4.046-6.053 6.798-7.995C20.783 1.404 24 .32 24 3.768c0 .69-.378 5.65-.624 6.479-.815 2.736-3.713 3.661-6.383 3.364 3.912.58 7.007 2.769 2.74 7.078-5.683 4.963-6.78-1.113-7.733-4.308-.953 3.195-2.81 9.498-7.823 4.308-4.557-5.073-1.082-6.498 2.83-7.078-2.67.297-5.568-.628-6.383-3.364C.378 9.418 0 4.458 0 3.768 0 .32 3.217 1.404 5.202 2.805z"/>',
  whatsapp:'<path fill-rule="evenodd" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zM9.1 7.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.1.8 2.6.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.3 0-.4.1-.5l.4-.4.3-.4c.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5z"/>'
};
function socialIcon(icon,cls){return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${SOCIAL_ICONS[icon]}</svg>`;}
function socialLinkAttrs(s){return `href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"`;}
function socialLabel(s){return s.platform===s.name||s.icon==='blog'?s.name:`${s.platform}: ${s.name}`;}
function renderSocials(){
  const grid=document.getElementById('socialsGrid');
  if(grid)grid.innerHTML=SOCIAL_LINKS.map(s=>{
    const live=!!s.url;
    const action=live?`<a class="social-card-btn" ${socialLinkAttrs(s)}>Visit on ${escapeHtml(s.platform)} ↗</a>`:'<span class="social-card-btn is-disabled">Link coming soon</span>';
    return `<article class="social-card social-${s.icon}" role="listitem">
      <div class="social-card-icon">${socialIcon(s.icon,'social-svg')}</div>
      <div class="social-card-platform">${escapeHtml(s.platform)}</div>
      <h3 class="social-card-name">${escapeHtml(s.name)}</h3>
      <p class="social-card-blurb">${escapeHtml(s.blurb)}</p>
      ${action}
    </article>`;
  }).join('');
  const live=SOCIAL_LINKS.filter(s=>s.url);
  const side=document.getElementById('sidebarSocials');
  if(side)side.innerHTML=live.map(s=>`<a ${socialLinkAttrs(s)} class="sidebar-link" title="${escapeHtml(socialLabel(s))}"><span class="sidebar-icon" aria-hidden="true">${socialIcon(s.icon,'sidebar-social-svg')}</span><span class="sidebar-social-name">${escapeHtml(s.short||(s.icon==='blog'?s.name:s.platform))}</span><span class="sidebar-external" aria-hidden="true">↗</span></a>`).join('');
  const foot=document.getElementById('footerSocial');
  if(foot)foot.innerHTML=live.map(s=>`<a class="social-btn" ${socialLinkAttrs(s)} role="listitem" aria-label="${escapeHtml(socialLabel(s))}" title="${escapeHtml(socialLabel(s))}">${socialIcon(s.icon,'footer-social-svg')}</a>`).join('');
}
renderSocials();

/* ================== NEWSROOM (WordPress blog) ==================
   Pulls posts straight from the WordPress.com public API. Each card opens the post on the blog. */
const BLOG_SITE='pjfeastafrica.wordpress.com';
const BLOG_PAGE_SIZE=9;
const blogState={posts:[],page:0,total:0,loading:false,error:false};
function htmlToText(html){return new DOMParser().parseFromString(html||'','text/html').body.textContent.trim();}
function firstImage(html){
  const img=new DOMParser().parseFromString(html||'','text/html').querySelector('img');
  if(!img)return '';
  const src=img.getAttribute('src')||'';
  if(!/^https:\/\//.test(src))return '';
  // WordPress.com serves resized copies via ?w=; keep thumbnails light.
  return /(wordpress\.com|wp\.com)\//.test(src)?src.split('?')[0]+'?w=600':src;
}
async function loadBlogPosts(){
  if(blogState.loading)return;
  blogState.loading=true;blogState.error=false;
  renderNewsroom();
  try{
    const url=`https://public-api.wordpress.com/rest/v1.1/sites/${BLOG_SITE}/posts/?number=${BLOG_PAGE_SIZE}&page=${blogState.page+1}&fields=ID,title,date,URL,excerpt,author,content,categories`;
    const res=await fetch(url);
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    blogState.total=data.found||0;
    blogState.page++;
    blogState.posts=blogState.posts.concat((data.posts||[]).map(p=>({
      title:htmlToText(p.title),
      excerpt:htmlToText(p.excerpt),
      url:p.URL,
      date:p.date,
      author:p.author&&p.author.name||'',
      category:Object.keys(p.categories||{}).find(c=>c!=='Uncategorized')||'Story',
      photo:firstImage(p.content)
    })));
  }catch(ex){
    console.error('Could not load blog posts:',ex);
    blogState.error=true;
  }
  blogState.loading=false;
  renderNewsroom();
}
function renderNewsroom(){
  const gridEl=document.getElementById('newsroomGrid');
  const moreBtn=document.getElementById('newsroomMore');
  if(!gridEl)return;
  if(!blogState.page&&!blogState.loading&&!blogState.error){loadBlogPosts();return;}
  const blogLink=`<a href="https://${BLOG_SITE}" target="_blank" rel="noopener noreferrer">visit our blog</a>`;
  if(!blogState.posts.length){
    gridEl.innerHTML=blogState.loading?'<div class="newsroom-empty">Loading the latest stories…</div>'
      :blogState.error?`<div class="newsroom-empty">We couldn't load our stories right now. Please ${blogLink} to read them.</div>`
      :`<div class="newsroom-empty">No stories yet. Please ${blogLink}.</div>`;
  }else{
    gridEl.innerHTML=blogState.posts.map(a=>{
      const short=a.excerpt.length>120?a.excerpt.slice(0,120)+'…':a.excerpt;
      return `
      <a href="${escapeHtml(a.url)}" class="news-card" target="_blank" rel="noopener noreferrer">
        <div class="news-card-photo">${a.photo?`<img src="${escapeHtml(a.photo)}" alt="" loading="lazy">`:''}</div>
        <div class="news-card-body">
          <span class="article-category" style="align-self:flex-start;">${escapeHtml(a.category)}</span>
          <div class="news-card-title">${escapeHtml(a.title)}</div>
          <div class="news-card-excerpt">${escapeHtml(short)}</div>
          <div class="news-card-byline">${a.author?'By '+escapeHtml(a.author)+', ':''}${escapeHtml(formatDateLabel(a.date))}</div>
          <span class="news-card-link">Read on our blog ↗</span>
        </div>
      </a>`;
    }).join('');
  }
  if(moreBtn){
    moreBtn.hidden=!(blogState.posts.length&&blogState.posts.length<blogState.total);
    moreBtn.disabled=blogState.loading;
    moreBtn.textContent=blogState.loading?'Loading…':'Load more stories';
  }
}
document.getElementById('newsroomMore')?.addEventListener('click',loadBlogPosts);

/* DASHBOARD ROUTING */
const pages=document.querySelectorAll('.page');
const sidebarLinks=document.querySelectorAll('.sidebar-link');
const sidebarEl=document.getElementById('sidebar');
const sidebarOverlay=document.getElementById('sidebarOverlay');
const sidebarToggle=document.getElementById('sidebarToggle');
const dashboardMain=document.getElementById('dashboardMain');

// Phones: ☰ slides the sidebar over the page. Wider screens: ☰ hides or shows it, and the choice is remembered.
const mobileNav=window.matchMedia('(max-width:900px)');
const SIDEBAR_KEY='pjfea-sidebar';
function syncToggleState(){
  const shown=mobileNav.matches?sidebarEl.classList.contains('open'):!document.documentElement.classList.contains('sidebar-collapsed');
  sidebarToggle.setAttribute('aria-expanded',String(shown));
  sidebarToggle.setAttribute('aria-label',shown?'Hide navigation':'Show navigation');
}
function openSidebar(){sidebarEl.classList.add('open');sidebarOverlay.classList.add('open');syncToggleState();}
function closeSidebar(){sidebarEl.classList.remove('open');sidebarOverlay.classList.remove('open');syncToggleState();}
function setSidebarCollapsed(collapsed){
  document.documentElement.classList.toggle('sidebar-collapsed',collapsed);
  try{collapsed?localStorage.setItem(SIDEBAR_KEY,'hidden'):localStorage.removeItem(SIDEBAR_KEY);}catch(e){}
  syncToggleState();
}
sidebarToggle.addEventListener('click',()=>{
  if(mobileNav.matches)sidebarEl.classList.contains('open')?closeSidebar():openSidebar();
  else setSidebarCollapsed(!document.documentElement.classList.contains('sidebar-collapsed'));
});
sidebarOverlay.addEventListener('click',closeSidebar);
mobileNav.addEventListener('change',closeSidebar);
syncToggleState();

function navigateTo(hash){
  if(location.hash===hash){routeFromHash();}else{location.hash=hash;}
}

// Each menu item is one .page. A hash can also name a section inside a page (e.g. #awards),
// which opens that page and scrolls to the section.
function showRoute(key){
  const routeOf=p=>p.dataset.route||p.id;
  let page=[...pages].find(p=>routeOf(p)===key);
  let target=null;
  if(!page&&key){
    target=document.getElementById(key);
    page=target&&target.closest('.page');
  }
  if(!page)page=[...pages].find(p=>routeOf(p)==='hero');
  pages.forEach(p=>p.classList.toggle('active',p===page));
  const route=routeOf(page);
  sidebarLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+route));
  closeSidebar();
  if(target){
    target.scrollIntoView();
  }else{
    dashboardMain.scrollTop=0;
    window.scrollTo(0,0);
  }
  if(page.querySelector('#newsroomGrid'))renderNewsroom();
}

function routeFromHash(){
  showRoute(location.hash.slice(1));
}

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const href=a.getAttribute('href');
    if(href.length>1){
      e.preventDefault();
      navigateTo(href);
    }
  });
});

window.addEventListener('hashchange',routeFromHash);
routeFromHash();
// THEME SETTINGS
(function(){
  const KEY='pjfea-theme';
  const btn=document.getElementById('settingsBtn');
  const menu=document.getElementById('settingsMenu');
  const options=menu.querySelectorAll('[data-theme-choice]');
  const media=window.matchMedia('(prefers-color-scheme: dark)');

  function getChoice(){
    try{const t=localStorage.getItem(KEY);if(t==='light'||t==='dark')return t;}catch(e){}
    return 'system';
  }
  function applyTheme(choice){
    const theme=choice==='system'?(media.matches?'dark':'light'):choice;
    document.documentElement.setAttribute('data-theme',theme);
    options.forEach(o=>o.setAttribute('aria-checked',String(o.dataset.themeChoice===choice)));
  }
  function setChoice(choice){
    try{
      if(choice==='system')localStorage.removeItem(KEY);
      else localStorage.setItem(KEY,choice);
    }catch(e){}
    applyTheme(choice);
  }
  function toggleMenu(open){
    menu.hidden=!open;
    btn.setAttribute('aria-expanded',String(open));
  }

  btn.addEventListener('click',e=>{e.stopPropagation();toggleMenu(menu.hidden);});
  options.forEach(o=>o.addEventListener('click',()=>setChoice(o.dataset.themeChoice)));
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target))toggleMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){toggleMenu(false);btn.focus();}});
  media.addEventListener('change',()=>{if(getChoice()==='system')applyTheme('system');});

  applyTheme(getChoice());
})();

/* ================== DONATIONS (Mobile Money) ==================
   Donors send money straight to this number. Put the real number and the
   name it is registered under (the name donors see before confirming). */
const DONATE_MOMO={
  number:'+256 746 279 441',
  name:'Peace Journalism Foundation'
};
let donateLastFocus=null;
function openDonate(btn){
  const card=btn.closest('.fund-card');
  const fund=card.querySelector('.fund-name').textContent;
  document.getElementById('dn-fundName').textContent=fund;
  document.getElementById('dn-number').textContent=DONATE_MOMO.number;
  document.getElementById('dn-call').href='tel:'+DONATE_MOMO.number.replace(/[^\d+]/g,'');
  document.getElementById('dn-accountName').textContent=DONATE_MOMO.name;
  document.getElementById('dn-reference').textContent=fund;
  document.getElementById('dn-copied').textContent='';
  donateLastFocus=document.activeElement;
  document.getElementById('donateModal').hidden=false;
  document.body.style.overflow='hidden';
  document.getElementById('dn-copy').focus();
}
function closeDonate(){
  document.getElementById('donateModal').hidden=true;
  document.body.style.overflow='';
  if(donateLastFocus&&donateLastFocus.focus)donateLastFocus.focus();
}
async function copyDonateNumber(){
  const msg=document.getElementById('dn-copied');
  try{
    await navigator.clipboard.writeText(DONATE_MOMO.number.replace(/\s/g,''));
    msg.textContent='Number copied.';
  }catch(e){
    msg.textContent='Could not copy. Please note the number down.';
  }
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('donateModal').hidden)closeDonate();});
document.getElementById('donateModal').addEventListener('click',e=>{if(e.target.id==='donateModal')closeDonate();});
