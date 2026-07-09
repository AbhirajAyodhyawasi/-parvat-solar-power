// Scroll progress bar
  const progressBar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', ()=>{
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    if(progressBar) progressBar.style.width = scrolled + '%';
  });

  // Header scroll state
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', ()=>{ header.classList.toggle('scrolled', window.scrollY > 20); });

  // Hero load-in sequence
  document.querySelectorAll('.hero-anim').forEach((el, i)=>{
    setTimeout(()=> el.classList.add('in'), 220 + i * 160);
  });

  // Parallax on hero sun + mountains
  const heroSun = document.querySelector('.hero-sun');
  const heroMountains = document.querySelector('.hero-mountains');
  const heroSection = document.querySelector('.hero');
  window.addEventListener('scroll', ()=>{
    if(!heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    if(rect.bottom < 0 || rect.top > window.innerHeight) return;
    const y = window.scrollY;
    if(heroSun) heroSun.style.transform = `translate(-50%, ${y * 0.25}px)`;
    if(heroMountains) heroMountains.style.transform = `translateY(${y * 0.12}px)`;
  }, { passive:true });

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  menuToggle.addEventListener('click', ()=> mobileMenu.classList.add('open'));
  mobileClose.addEventListener('click', ()=> mobileMenu.classList.remove('open'));
  mobileMenu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> mobileMenu.classList.remove('open')));

  // Reveal on scroll (grids get staggered child delays via CSS)
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:0.15 });
  revealEls.forEach(el=> io.observe(el));

  // Subtle magnetic pull on gold buttons (desktop only)
  if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    document.querySelectorAll('.btn-gold').forEach(btn=>{
      btn.addEventListener('mousemove', (e)=>{
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width/2) * 0.18;
        const y = (e.clientY - r.top - r.height/2) * 0.28;
        btn.style.transform = `translate(${x}px, ${y - 2}px)`;
      });
      btn.addEventListener('mouseleave', ()=>{ btn.style.transform = ''; });
    });
  }

  // Active nav link while scrolling
  const navSections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const navObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if(link && entry.isIntersecting){
        navLinks.forEach(l=> l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { threshold:0.4, rootMargin:'-80px 0px -55% 0px' });
  navSections.forEach(s=> navObserver.observe(s));

  // Count-up stats
  const stats = document.querySelectorAll('.stat-num');
  const statsObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '+';
        let cur = 0;
        const step = Math.max(target/60, 0.5);
        const tick = ()=>{
          cur += step;
          if(cur >= target){ el.textContent = target + suffix; return; }
          el.textContent = Math.floor(cur) + suffix;
          requestAnimationFrame(tick);
        };
        tick();
        statsObserver.unobserve(el);
      }
    });
  }, { threshold:0.5 });
  stats.forEach(s=> statsObserver.observe(s));

  // Gallery filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      filterBtns.forEach(b=> b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      galleryItems.forEach(item=>{
        item.classList.toggle('hide', f !== 'all' && item.dataset.cat !== f);
      });
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i=>{ i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
      if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  // Load approved testimonials dynamically and render marquee
  let latestTestimonials = [];
  async function loadTestimonials(){
    const track = document.getElementById('testiTrack');
    if(!track) return;
    try{
      const res = await fetch('/api/testimonials', { cache: 'no-store' });
      const list = await res.json();
      if(!Array.isArray(list)) return;

      latestTestimonials = list;
      updateReviewCount(list.length);

      if(list.length === 0){
        track.innerHTML = '<div class="testi-card"><p class="testi-quote">Be the first to share your experience with Parvat Solar Power.</p></div>';
        return;
      }

      const cardHTML = (t) => `
        <div class="testi-card">
          <p class="testi-quote">"${escapeHTML(t.message)}"</p>
          <div class="testi-person">
            <span class="testi-avatar">${escapeHTML(t.name.charAt(0).toUpperCase())}</span>
            <span><span class="testi-name">${escapeHTML(t.name)}</span><span class="testi-loc">${escapeHTML(t.city || '')}</span></span>
          </div>
        </div>`;
      // Render the list twice back-to-back for a seamless infinite loop.
      const newHTML = list.map(cardHTML).join('') + list.map(cardHTML).join('');

      // Only touch the DOM if something actually changed, and fade smoothly
      // rather than hard-swapping (which made it look like reviews vanished).
      if(track.dataset.count !== String(list.length)){
        track.classList.add('fading');
        setTimeout(()=>{
          track.innerHTML = newHTML;
          track.dataset.count = String(list.length);
          track.style.animationDuration = Math.max(list.length * 9, 20) + 's';
          track.classList.remove('fading');
        }, 350);
      }
    }catch(err){
      console.error('Could not load testimonials', err);
    }
  }
  function updateReviewCount(n){
    const el = document.getElementById('reviewCount');
    if(el) el.textContent = n > 0 ? `(${n})` : '';
  }
  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  loadTestimonials();
  // Re-check for newly approved testimonials every 20 seconds without needing a manual refresh
  setInterval(loadTestimonials, 20000);

  // View All Reviews modal
  const reviewModal = document.getElementById('reviewModal');
  const viewAllBtn = document.getElementById('viewAllBtn');
  const reviewModalClose = document.getElementById('reviewModalClose');
  if(viewAllBtn){
    viewAllBtn.addEventListener('click', ()=>{
      const listEl = document.getElementById('reviewModalList');
      if(latestTestimonials.length === 0){
        listEl.innerHTML = '<div class="review-modal-empty">No reviews yet — be the first to share your experience.</div>';
      }else{
        const sorted = [...latestTestimonials].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        listEl.innerHTML = sorted.map(t => `
          <div class="review-row">
            <div class="review-row-top">
              <span class="review-row-name">${escapeHTML(t.name)}${t.city ? ' · ' + escapeHTML(t.city) : ''}</span>
              <span class="review-row-stars">${'★'.repeat(t.rating || 0)}${'☆'.repeat(5 - (t.rating || 0))}</span>
            </div>
            <p>"${escapeHTML(t.message)}"</p>
          </div>
        `).join('');
      }
      reviewModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  function closeReviewModal(){
    reviewModal.classList.remove('open');
    document.body.style.overflow = '';
  }
  if(reviewModalClose) reviewModalClose.addEventListener('click', closeReviewModal);
  if(reviewModal) reviewModal.addEventListener('click', (e)=>{ if(e.target === reviewModal) closeReviewModal(); });
  let selectedRating = 0;
  const stars = document.querySelectorAll('#starRating .star');
  stars.forEach(star=>{
    star.addEventListener('click', ()=>{
      selectedRating = parseInt(star.dataset.value);
      stars.forEach(s=> s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating));
    });
    star.addEventListener('mouseenter', ()=>{
      stars.forEach(s=> s.classList.toggle('hovered', parseInt(s.dataset.value) <= parseInt(star.dataset.value)));
    });
    star.addEventListener('mouseleave', ()=>{ stars.forEach(s=> s.classList.remove('hovered')); });
  });

  // Testimonial form -> submit to backend for approval
  const testiForm = document.getElementById('testiForm');
  if(testiForm){
    testiForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const submitBtn = testiForm.querySelector('.submit-btn');
      const name = document.getElementById('t-name').value.trim();
      const city = document.getElementById('t-city').value.trim();
      const message = document.getElementById('t-message').value.trim();

      if(!name || !message){ return; }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try{
        const res = await fetch('/api/testimonials', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ name, city, rating: selectedRating, message })
        });
        if(!res.ok) throw new Error('Submit failed');

        testiForm.innerHTML = `
          <div class="testi-thankyou">
            <div class="testi-thankyou-icon">✓</div>
            <h4>Thank you!</h4>
            <p>Your testimonial has been submitted for approval.</p>
          </div>`;
      }catch(err){
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Testimonial';
        alert('Something went wrong. Please try again or reach us on WhatsApp.');
      }
    });
  }

  // Contact form -> WhatsApp
  document.getElementById('quoteForm').addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('f-name').value;
    const phone = document.getElementById('f-phone').value;
    const email = document.getElementById('f-email').value;
    const city = document.getElementById('f-city').value;
    const service = document.getElementById('f-service').value;
    const message = document.getElementById('f-message').value;
    let text = `Hi PSP, I'd like a free solar consultation.%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}`;
    if(email) text += `%0AEmail: ${encodeURIComponent(email)}`;
    if(city) text += `%0ACity: ${encodeURIComponent(city)}`;
    if(service) text += `%0AService: ${encodeURIComponent(service)}`;
    if(message) text += `%0AMessage: ${encodeURIComponent(message)}`;
    window.open(`https://wa.me/917895531049?text=${text}`, '_blank');
  });