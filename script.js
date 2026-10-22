const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('visible');
      e.target.querySelectorAll('[data-target]').forEach(animateCounter);
    }
  });
},{threshold:0.15});
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

function toggleAmount(btn){
  btn.closest('.donation-amounts').querySelectorAll('.amount-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function updateCountdown(){
  const deadline=new Date();
  deadline.setDate(deadline.getDate()+47);
  const diff=deadline-new Date();
  if(diff>0){
    const d=document.getElementById('cd-days'),h=document.getElementById('cd-hours'),m=document.getElementById('cd-mins');
    if(d)d.textContent=Math.floor(diff/86400000);
    if(h)h.textContent=String(Math.floor((diff%86400000)/3600000)).padStart(2,'0');
    if(m)m.textContent=String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
  }
}
updateCountdown();
setInterval(updateCountdown,60000);


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
   Paste each platform's link into `url`. An empty url shows "Link coming soon".
   The Social Media page, the sidebar and the footer all read from this list. */
const SOCIAL_LINKS=[
  {id:'x',name:'X (Twitter)',url:'https://x.com/pjfeastafrica',blurb:'Quick updates, breaking stories and conversations on peace and media.'},
  {id:'linkedin',name:'LinkedIn',url:'',blurb:'Organisational news, partnerships, fellowships and opportunities.'},
  {id:'facebook',name:'Facebook',url:'',blurb:'Community stories, event photos and training highlights.'},
  {id:'bluesky',name:'Bluesky',url:'https://bsky.app/profile/peace-journalism.bsky.social',blurb:'Follow our reporting and join the discussion on Bluesky.'},
  {id:'channel',name:'Our Channel',url:'',blurb:'Videos, interviews and documentaries from the field.'},
  {id:'blog',name:'Our Blog',url:'https://pjfeastafrica.wordpress.com',blurb:'In-depth stories and features from journalists across East Africa.'}
];
const SOCIAL_ICONS={
  x:'<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
  linkedin:'<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
  facebook:'<path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>',
  bluesky:'<path d="M5.202 2.805C7.954 4.747 10.913 8.686 12 10.8c1.087-2.114 4.046-6.053 6.798-7.995C20.783 1.404 24 .32 24 3.768c0 .69-.378 5.65-.624 6.479-.815 2.736-3.713 3.661-6.383 3.364 3.912.58 7.007 2.769 2.74 7.078-5.683 4.963-6.78-1.113-7.733-4.308-.953 3.195-2.81 9.498-7.823 4.308-4.557-5.073-1.082-6.498 2.83-7.078-2.67.297-5.568-.628-6.383-3.364C.378 9.418 0 4.458 0 3.768 0 .32 3.217 1.404 5.202 2.805z"/>',
  channel:'<path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm-2.5 16.9V7.1l7.8 4.9-7.8 4.9z"/>',
  blog:'<path d="M4 2h12l4 4v16H4V2zm2 2v16h12V7h-3V4H6zm2 5h8v2H8V9zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>'
};
function socialIcon(id,cls){return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${SOCIAL_ICONS[id]}</svg>`;}
function socialLinkAttrs(s){return `href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"`;}
function renderSocials(){
  const grid=document.getElementById('socialsGrid');
  if(grid)grid.innerHTML=SOCIAL_LINKS.map(s=>{
    const live=!!s.url;
    const action=live?`<a class="social-card-btn" ${socialLinkAttrs(s)}>Visit ${escapeHtml(s.name)} ↗</a>`:'<span class="social-card-btn is-disabled">Link coming soon</span>';
    return `<article class="social-card social-${s.id}" role="listitem">
      <div class="social-card-icon">${socialIcon(s.id,'social-svg')}</div>
      <h3 class="social-card-name">${escapeHtml(s.name)}</h3>
      <p class="social-card-blurb">${escapeHtml(s.blurb)}</p>
      ${action}
    </article>`;
  }).join('');
  const live=SOCIAL_LINKS.filter(s=>s.url);
  const side=document.getElementById('sidebarSocials');
  if(side)side.innerHTML=live.map(s=>`<a ${socialLinkAttrs(s)} class="sidebar-link"><span class="sidebar-icon" aria-hidden="true">${socialIcon(s.id,'sidebar-social-svg')}</span>${escapeHtml(s.name)}<span class="sidebar-external" aria-hidden="true">↗</span></a>`).join('');
  const foot=document.getElementById('footerSocial');
  if(foot)foot.innerHTML=live.map(s=>`<a class="social-btn" ${socialLinkAttrs(s)} role="listitem" aria-label="${escapeHtml(s.name)}">${socialIcon(s.id,'footer-social-svg')}</a>`).join('');
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
      id:String(p.ID),
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
      <a href="#story:${escapeHtml(a.id)}" class="news-card">
        <div class="news-card-photo">${a.photo?`<img src="${escapeHtml(a.photo)}" alt="" loading="lazy">`:''}</div>
        <div class="news-card-body">
          <span class="article-category" style="align-self:flex-start;">${escapeHtml(a.category)}</span>
          <div class="news-card-title">${escapeHtml(a.title)}</div>
          <div class="news-card-excerpt">${escapeHtml(short)}</div>
          <div class="news-card-byline">${a.author?'By '+escapeHtml(a.author)+' · ':''}${escapeHtml(formatDateLabel(a.date))}</div>
          <span class="news-card-link">Read story →</span>
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

/* ================== STORY READER ==================
   Opens a blog post inside the site (#story:<post ID>) in an iframe, with links back to the Newsroom. */
const storyFrame=document.getElementById('storyFrame');
storyFrame.addEventListener('load',()=>{
  if(storyFrame.getAttribute('src'))document.getElementById('storyLoading').hidden=true;
});
function isBlogUrl(url){return typeof url==='string'&&url.startsWith(`https://${BLOG_SITE}/`);}
async function findStory(id){
  const known=blogState.posts.find(p=>p.id===id);
  if(known)return known;
  // Opened from a shared link or after a refresh: the list isn't loaded, so fetch just this post.
  const res=await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${BLOG_SITE}/posts/${encodeURIComponent(id)}?fields=ID,title,URL`);
  if(!res.ok)throw new Error('HTTP '+res.status);
  const p=await res.json();
  return {id:String(p.ID),title:htmlToText(p.title),url:p.URL};
}
function setStoryLink(el,post,label){
  el.hidden=!post;
  if(post){el.href='#story:'+post.id;el.title=post.title;el.textContent=label;}
}
async function renderStory(id){
  const titleEl=document.getElementById('storyTitle');
  const loading=document.getElementById('storyLoading');
  const external=document.getElementById('storyExternal');
  loading.hidden=false;
  loading.textContent='Loading story…';
  titleEl.textContent='';
  let post=null;
  try{post=id&&await findStory(id);}catch(ex){console.error('Could not load story:',ex);}
  if(currentStoryId!==id)return; // the reader moved on while this was loading
  if(!post||!isBlogUrl(post.url)){
    storyFrame.removeAttribute('src');
    loading.innerHTML=`We couldn't open this story. <a href="#newsroom">Back to the Newsroom</a>`;
    external.href=`https://${BLOG_SITE}`;
    setStoryLink(document.getElementById('storyPrev'),null);
    setStoryLink(document.getElementById('storyNext'),null);
    return;
  }
  titleEl.textContent=post.title;
  external.href=post.url;
  const i=blogState.posts.findIndex(p=>p.id===post.id);
  setStoryLink(document.getElementById('storyPrev'),i>0?blogState.posts[i-1]:null,'← Newer');
  setStoryLink(document.getElementById('storyNext'),i>=0?blogState.posts[i+1]:null,'Older →');
  if(storyFrame.getAttribute('src')!==post.url)storyFrame.src=post.url;
  else loading.hidden=true;
  // Opened directly: load the story list in the background so Newer/Older can appear.
  if(i<0&&!blogState.page&&!blogState.loading){
    await loadBlogPosts();
    if(currentStoryId!==id)return;
    const j=blogState.posts.findIndex(p=>p.id===post.id);
    if(j>=0){
      setStoryLink(document.getElementById('storyPrev'),blogState.posts[j-1],'← Newer');
      setStoryLink(document.getElementById('storyNext'),blogState.posts[j+1],'Older →');
    }
  }
}
function closeStory(){
  // Unload the post so its videos or audio stop when the reader leaves.
  if(storyFrame.getAttribute('src'))storyFrame.removeAttribute('src');
}
let currentStoryId=null;

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

function showRoute(rawKey){
  let [key,subId]=(rawKey||'').split(/:(.*)/);
  if(!key)key='hero';
  let matched=false;
  pages.forEach(p=>{
    const routeKey=p.dataset.route||p.id;
    const isMatch=routeKey===key;
    p.classList.toggle('active',isMatch);
    if(isMatch)matched=true;
  });
  if(!matched){
    key='hero';
    pages.forEach(p=>p.classList.toggle('active',(p.dataset.route||p.id)==='hero'));
  }
  const navKey=key==='story'?'newsroom':key;
  sidebarLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+navKey));
  dashboardMain.scrollTop=0;
  window.scrollTo(0,0);
  closeSidebar();
  if(key==='newsroom')renderNewsroom();
  if(key==='story'){currentStoryId=subId||null;renderStory(currentStoryId);}
  else{currentStoryId=null;closeStory();}
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
  number:'+256 7XX XXX XXX',
  name:'Peace Journalism Foundation'
};
let donateLastFocus=null;
function openDonate(btn){
  const card=btn.closest('.fund-card');
  const fund=card.querySelector('.fund-name').textContent;
  const active=card.querySelector('.amount-btn.active');
  const preset=active&&/\d/.test(active.textContent)?active.textContent.trim():'';
  document.getElementById('dn-fundName').textContent=fund;
  document.getElementById('dn-number').textContent=DONATE_MOMO.number;
  document.getElementById('dn-call').href='tel:'+DONATE_MOMO.number.replace(/[^\d+]/g,'');
  document.getElementById('dn-accountName').textContent=DONATE_MOMO.name;
  document.getElementById('dn-reference').textContent=fund;
  const amt=document.getElementById('dn-amountRow');
  amt.hidden=!preset;
  document.getElementById('dn-amount').textContent=preset;
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
