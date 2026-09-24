(()=>{
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const story=$('#storyCard'), storyBtn=$('#storyToggle');
  storyBtn?.addEventListener('click',()=>{
    const open=story.classList.toggle('expanded');
    storyBtn.setAttribute('aria-expanded',open);
    storyBtn.innerHTML=open?'Read less <span>‹</span>':'Read my story <span>›</span>';
  });

  $$('.phase-head').forEach(btn=>btn.addEventListener('click',()=>{
    const card=btn.closest('.phase-card'); const open=card.classList.toggle('open');
    btn.setAttribute('aria-expanded',open);
  }));

  const modal=$('#subjectModal');
  const modalTitle=$('#modalTitle'), modalKicker=$('#modalKicker'), modalIntro=$('#modalIntro'), modalStatus=$('#modalStatus'), modalPhase=$('#modalPhase');
  $$('.subject-card').forEach(card=>card.addEventListener('click',()=>{
    modalTitle.textContent=card.dataset.subject;
    modalKicker.textContent=card.dataset.visual||'MEDICAL SUBJECT';
    modalIntro.textContent=card.dataset.intro||'A dedicated workspace for notes, resources and progress.';
    modalStatus.textContent=card.dataset.status||'NOT STARTED';
    modalPhase.textContent=card.dataset.phase||'';
    modal.dataset.subject=card.dataset.subject||'';
    modal.classList.add('open'); document.body.style.overflow='hidden';
  }));
  function closeModal(){modal.classList.remove('open');document.body.style.overflow=''}
  $('#modalClose')?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('open'))closeModal()});
  $('#modalExplore')?.addEventListener('click',()=>{
    closeModal(); const target=$('#materials'); target?.scrollIntoView({behavior:'smooth'});
    const note=$('#materialSubject'); if(note){note.value=modal?.dataset.subject||'';}
  });

  // Local-only material uploader. This is intentionally browser storage, not a permanent server upload.
  const dbName='tasif-mbbs-materials-v1'; let db;
  const request=indexedDB.open(dbName,1);
  request.onupgradeneeded=e=>e.target.result.createObjectStore('materials',{keyPath:'id',autoIncrement:true});
  request.onsuccess=e=>{db=e.target.result;renderMaterials()};
  function tx(mode='readonly'){return db?.transaction('materials',mode).objectStore('materials')}
  function renderMaterials(){
    const list=$('#materialList'); if(!list||!db)return;
    const r=tx().getAll(); r.onsuccess=()=>{
      const rows=r.result.filter(x=>x.subject==='Pharmacology & Therapeutics');
      list.innerHTML='';
      if(!rows.length){list.innerHTML='<div class="empty-material">No additional materials yet. Use <b>Add Material</b> to keep building the archive.</div>';return}
      rows.forEach(x=>{
        const el=document.createElement('article');el.className='material-card';
        el.innerHTML='<div><div class="material-type">'+escapeHtml(x.type||'FILE')+'</div><h4>'+escapeHtml(x.title)+'</h4><div class="material-meta">'+escapeHtml(x.name||'Uploaded material')+'</div></div><div class="material-actions"><button class="material-btn" data-open="'+x.id+'">Open</button><button class="material-btn" data-del="'+x.id+'">Delete</button></div>';
        list.appendChild(el);
      });
      $$('[data-open]',list).forEach(b=>b.onclick=()=>openMaterial(Number(b.dataset.open)));
      $$('[data-del]',list).forEach(b=>b.onclick=()=>deleteMaterial(Number(b.dataset.del)));
    };
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function openMaterial(id){const r=tx().get(id);r.onsuccess=()=>{const x=r.result;if(!x)return;const url=URL.createObjectURL(x.file);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000)}}
  function deleteMaterial(id){if(!confirm('Delete this local material?'))return;const r=tx('readwrite').delete(id);r.onsuccess=renderMaterials}
  $('#addMaterialBtn')?.addEventListener('click',()=>$('#materialForm')?.classList.toggle('open'));
  $('#materialForm')?.addEventListener('submit',e=>{
    e.preventDefault(); if(!db)return;
    const file=$('#materialFile').files[0]; if(!file){alert('Choose a file first.');return}
    const title=$('#materialTitle').value.trim()||file.name;
    const type=$('#materialType').value;
    const r=tx('readwrite').add({title,type,name:file.name,subject:'Pharmacology & Therapeutics',file,createdAt:Date.now()});
    r.onsuccess=()=>{e.target.reset();$('#materialForm').classList.remove('open');renderMaterials()};
  });

  // Make the two existing lecture-note PDFs available in the new home.
  const existing=[
    {title:"Pharmacology — Term 2 Lecture Notes",lecturer:"Dr. Mareyum Maam",term:"2nd Term",file:"pdfs/pharmacology/pharmacology-term-2-mareyum-maam-compressed.pdf"},
    {title:"Pharmacology — Term 2 Lecture Notes",lecturer:"Dr. Shammi Maam",term:"2nd Term",file:"pdfs/pharmacology/pharmacology-term-2-shammi-maam-compressed.pdf"}
  ];
  const fixed=$('#fixedMaterials');
  existing.forEach(x=>{const el=document.createElement('article');el.className='material-card reveal';el.innerHTML='<div><div class="material-type">LECTURE NOTES</div><h4>'+x.title+'</h4><div class="material-meta">'+x.lecturer+' · '+x.term+'</div></div><div class="material-actions"><a class="material-btn" href="'+x.file+'" target="_blank" rel="noopener">Open PDF →</a></div>';fixed?.appendChild(el)});
})();
