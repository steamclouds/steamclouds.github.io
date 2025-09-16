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
  var releaseList = document.getElementById('release-list');
  if(!releaseList) return;

  fetch('https://api.github.com/repos/R3verseNinja/steamclouds/releases')
    .then(function(res){ return res.json(); })
    .then(function(data){
      releaseList.innerHTML = '';
      data.slice(0,5).forEach(function(rel){
        var li = document.createElement('li');
        var a = document.createElement('a');

        // Cari asset SteamClouds.exe di setiap release
        var exe = rel.assets.find(function(asset){
          return asset.name === 'SteamClouds.exe';
        });

        if(exe){
          a.href = exe.browser_download_url;
          a.textContent = rel.name + ' - Download SteamClouds.exe';
          a.target = '_blank';
          li.appendChild(a);
          releaseList.appendChild(li);
        }
      });

      if(!releaseList.children.length){
        releaseList.innerHTML = '<li>No valid releases found.</li>';
      }
    })
    .catch(function(){
      if(!releaseList.children.length){
        releaseList.innerHTML = '<li>Failed to load releases.</li>';
      }
    });
}

  window.initAdblockOverlay=function(){
    var existingOverlay=document.querySelector('.full-lock-overlay')
    var overlay=existingOverlay||document.createElement('div')
    if(!existingOverlay){
      overlay.className='full-lock-overlay'
      overlay.style.position='fixed'
      overlay.style.inset='0'
      overlay.style.zIndex='999999'
      overlay.style.background='rgba(0,0,0,0.95)'
      overlay.style.display='none'
      overlay.style.alignItems='center'
      overlay.style.justifyContent='center'
      overlay.style.color='#fff'
      overlay.style.textAlign='center'
      overlay.style.padding='24px'
      var msg=document.createElement('div')
      msg.innerHTML='<h2>AdBlock Detected</h2><p>Please disable AdBlock to access this website.</p>'
      overlay.appendChild(msg)
      document.body.appendChild(overlay)
    }

    function createBait(){
      var d=document.createElement('div')
      d.className='adsbox'
      d.style.position='absolute'
      d.style.left='-9999px'
      d.style.width='1px'
      d.style.height='1px'
      document.body.appendChild(d)
      return d
    }
    function detectAdblock(){
      return new Promise(function(resolve){
        var bait=createBait()
        window.setTimeout(function(){
          var blocked=!bait||bait.offsetParent===null||bait.clientHeight===0
          if(bait&&bait.parentNode)bait.parentNode.removeChild(bait)
          resolve(blocked)
        },100)
      })
    }
    function showLock(ov){
      ov.style.display='flex'
      document.documentElement.style.overflow='hidden'
      document.body.style.overflow='hidden'
    }
    function hideLock(ov){
      ov.style.display='none'
      document.documentElement.style.overflow=''
      document.body.style.overflow=''
    }

    var lockOv=overlay
    function enforce(){
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

