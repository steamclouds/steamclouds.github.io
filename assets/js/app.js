(function(){
  function onReady(fn){
    if(document.readyState!=='loading'){fn()}else{document.addEventListener('DOMContentLoaded',fn)}
  }

  function initMainMenu(){
    var menuToggle=document.getElementById('menuToggle')
    var mainMenu=document.getElementById('main-menu')
    if(!menuToggle||!mainMenu)return
    function openMenu(){
      mainMenu.hidden=false
      menuToggle.setAttribute('aria-expanded','true')
      var firstLink=mainMenu.querySelector('a,button')
      if(firstLink)firstLink.focus()
    }
    function closeMenu(){
      mainMenu.hidden=true
      menuToggle.setAttribute('aria-expanded','false')
    }
    menuToggle.addEventListener('click',function(){
      var expanded=menuToggle.getAttribute('aria-expanded')==='true'
      if(expanded){closeMenu()}else{openMenu()}
    })
    document.addEventListener('click',function(e){
      if(!mainMenu.contains(e.target)&&!menuToggle.contains(e.target)){
        closeMenu()
      }
    })
  }

  function initFAQ(){
    var faqItems=document.querySelectorAll('.faq-item button')
    faqItems.forEach(function(btn){
      btn.addEventListener('click',function(){
        var expanded=btn.getAttribute('aria-expanded')==='true'
        faqItems.forEach(function(b){
          b.setAttribute('aria-expanded','false')
          var content=document.getElementById(b.getAttribute('aria-controls'))
          if(content)content.hidden=true
        })
        if(!expanded){
          btn.setAttribute('aria-expanded','true')
          var c=document.getElementById(btn.getAttribute('aria-controls'))
          if(c)c.hidden=false
        }
      })
    })
  }

  function initSearch(){
    var input=document.getElementById('searchInput')
    var cards=document.querySelectorAll('.card')
    if(!input||!cards.length)return
    input.addEventListener('input',function(){
      var val=input.value.toLowerCase()
      cards.forEach(function(c){
        var txt=c.textContent.toLowerCase()
        c.style.display=txt.includes(val)?'':'none'
      })
    })
  }

  function fetchGitHubReleases(){
    var releaseList=document.getElementById('release-list')
    if(!releaseList)return
    fetch('https://api.github.com/repos/pjy612/SteamManifestCache/releases')
      .then(function(res){return res.json()})
      .then(function(data){
        releaseList.innerHTML=''
        data.slice(0,5).forEach(function(rel){
          var li=document.createElement('li')
          var a=document.createElement('a')
          a.href=rel.html_url
          a.textContent=rel.name
          a.target='_blank'
          li.appendChild(a)
          releaseList.appendChild(li)
        })
      })
      .catch(function(){
        if(!releaseList.children.length){
          releaseList.innerHTML='<li>Failed to load releases.</li>'
        }
      })
  }

  window.initAdblockOverlay=function(){
    var adContainer=document.querySelector('.ad-container')
    var existingOverlay=document.querySelector('.full-lock-overlay')||document.querySelector('.adblock-overlay')
    var overlay=existingOverlay||document.createElement('div')
    if(!existingOverlay){
      overlay.className='full-lock-overlay'
      overlay.setAttribute('role','dialog')
      overlay.setAttribute('aria-modal','true')
      overlay.setAttribute('aria-hidden','true')
      overlay.style.position='fixed'
      overlay.style.inset='0'
      overlay.style.zIndex='999999'
      overlay.style.background='rgba(0,0,0,0.92)'
      overlay.style.display='none'
      overlay.style.alignItems='center'
      overlay.style.justifyContent='center'
      overlay.style.textAlign='center'
      overlay.style.color='#fff'
      overlay.style.padding='24px'
      var panel=document.createElement('div')
      panel.style.maxWidth='720px'
      panel.style.width='100%'
      panel.style.margin='0 16px'
      var h=document.createElement('h2')
      h.textContent='Ads blocked — site locked'
      h.style.margin='0 0 12px'
      var p=document.createElement('p')
      p.textContent='You are using an ad blocker. Please whitelist this site to continue using it. You can also view our sponsor banner.'
      p.style.margin='0 0 18px'
      var controls=document.createElement('div')
      controls.style.display='flex'
      controls.style.gap='10px'
      controls.style.justifyContent='center'
      var btnWhitelist=document.createElement('button')
      btnWhitelist.textContent='I whitelisted'
      btnWhitelist.style.padding='10px 14px'
      var btnSponsor=document.createElement('button')
      btnSponsor.textContent='Show sponsor'
      btnSponsor.style.padding='10px 14px'
      var btnVisit=document.createElement('a')
      btnVisit.textContent='Learn why'
      btnVisit.href='#'
      btnVisit.style.padding='10px 14px'
      btnVisit.style.border='1px solid rgba(255,255,255,0.12)'
      btnVisit.style.color='#fff'
      controls.appendChild(btnWhitelist)
      controls.appendChild(btnSponsor)
      controls.appendChild(btnVisit)
      panel.appendChild(h)
      panel.appendChild(p)
      panel.appendChild(controls)
      overlay.appendChild(panel)
      document.body.appendChild(overlay)
      btnWhitelist.addEventListener('click',function(){
        try{localStorage.setItem('adblockIgnore_v4','1')}catch(e){}
        hideLock(overlay)
        tryEnableAds()
        setTimeout(function(){detectAdblock().then(function(blocked){if(blocked)showLock(overlay)})},1000)
      })
      btnSponsor.addEventListener('click',function(){
        if(adContainer)adContainer.classList.add('show-fallback')
        hideLock(overlay)
        try{localStorage.setItem('adblockFallback_v4','1')}catch(e){}
      })
      btnVisit.addEventListener('click',function(){try{window.open('https://example.com/why-ads','_blank')}catch(e){}})
    }
    function createBaits(){
      var classes=['adsbox','ad-banner','adunit','adsbygoogle','doubleclick','googad']
      var nodes=[]
      classes.forEach(function(c){
        var d=document.createElement('div')
        d.className=c
        d.style.width='1px'
        d.style.height='1px'
        d.style.position='absolute'
        d.style.left='-9999px'
        document.body.appendChild(d)
        nodes.push(d)
      })
      return nodes
    }
    function removeBaits(nodes){
      nodes.forEach(function(n){try{n.parentNode&&n.parentNode.removeChild(n)}catch(e){}})
    }
    function checkBaits(){
      var nodes=createBaits()
      var blocked=false
      nodes.forEach(function(n){
        var rect=n.getBoundingClientRect()
        var style=window.getComputedStyle(n)
        if(rect.width===0&&rect.height===0)blocked=true
        if(style&&(style.display==='none'||style.visibility==='hidden'||style.opacity==='0'))blocked=true
      })
      removeBaits(nodes)
      return blocked
    }
    function checkInsElement(){
      var inel=document.querySelector('ins.adsbygoogle')
      if(!inel)return true
      var rect=inel.getBoundingClientRect()
      var style=window.getComputedStyle(inel)
      if(rect.width<8||rect.height<8)return true
      if(style&&(style.display==='none'||style.visibility==='hidden'))return true
      return false
    }
    function checkScriptLoad(timeout){
      return new Promise(function(resolve){
        var s=document.createElement('script')
        s.async=true
        s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?cb='+Date.now()
        var done=false
        s.onload=function(){if(!done){done=true;try{s.parentNode&&s.parentNode.removeChild(s)}catch(e){}resolve(false)}}
        s.onerror=function(){if(!done){done=true;try{s.parentNode&&s.parentNode.removeChild(s)}catch(e){}resolve(true)}}
        document.head.appendChild(s)
        setTimeout(function(){if(!done){done=true;try{s.parentNode&&s.parentNode.removeChild(s)}catch(e){}resolve(true)}},timeout||1500)
      })
    }
    function detectAdblock(){
      return new Promise(function(resolve){
        try{
          var baitRes=checkBaits()
          var insRes=checkInsElement()
          return checkScriptLoad().then(function(scriptRes){
            var blocked=(scriptRes&&(baitRes||insRes))||(baitRes&&insRes)
            resolve(blocked)
          }).catch(function(){resolve(true)})
        }catch(e){resolve(true)}
      })
    }
    function showLock(ov){
      ov.setAttribute('aria-hidden','false')
      ov.style.display='flex'
      document.documentElement.style.overflow='hidden'
      document.body.style.touchAction='none'
      var mainEl=document.querySelector('main')||document.querySelector('body')
      if(mainEl)mainEl.setAttribute('aria-hidden','true')
    }
    function hideLock(ov){
      ov.setAttribute('aria-hidden','true')
      ov.style.display='none'
      document.documentElement.style.overflow=''
      document.body.style.touchAction=''
      var mainEl=document.querySelector('main')||document.querySelector('body')
      if(mainEl)mainEl.removeAttribute('aria-hidden')
    }
    function tryEnableAds(){
      try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}
    }
    var lockOv=overlay
    function enforce(){
      if(localStorage.getItem('adblockFallback_v4')==='1')return
      if(localStorage.getItem('adblockIgnore_v4')==='1')return
      detectAdblock().then(function(blocked){
        if(blocked){showLock(lockOv)}else{hideLock(lockOv)}
      })
    }
    enforce()
    setInterval(enforce,4000)
  }

  onReady(function(){
    initMainMenu()
    initFAQ()
    initSearch()
    fetchGitHubReleases()
    initAdblockOverlay()
    window.addEventListener('error',function(ev){console.error('Error:',ev.message)})
  })
})();
