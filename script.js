// Storage keys
const STORAGE_KEY       = 'dragon_tdl_tasks';
const STAGE_STORAGE_KEY = 'dragon_tdl_stage';
const TASKS_PER_STAGE   = 1;

// Dragon stage names (6 evolution stages)
const STAGE_NAMES = [
  'Sleeping Egg',      // Stage 1
  'Egg Cracking...',   // Stage 2
  'Shell Breaking!',    // Stage 3
  'Hatching!',         // Stage 4
  'Baby Dragon!',      // Stage 5
  'Small Dragon!'      // Stage 6
];

// Dragon sprite paths (PNG files)
const DRAGON_STAGES = [
  'assets/egg.png',           // Stage 1
  'assets/egg-crack1.png',    // Stage 2
  'assets/egg-crack2.png',    // Stage 3
  'assets/dragon-head.png',   // Stage 4
  'assets/baby-dragon.png',   // Stage 5
  'assets/dragon.png'         // Stage 6
];

// Application state
let tasks = [];
let currentStage = 1;
let completedCount = 0;

// DOM Elements
const taskInput     = document.getElementById('task-input');
const addBtn        = document.getElementById('add-btn');
const taskList      = document.getElementById('task-list');
const dragonSprite  = document.getElementById('dragon-sprite');
const dragonWrap    = document.getElementById('dragon-container');
const sparklesEl    = document.getElementById('sparkles');
const xpFill        = document.getElementById('xp-fill');
const xpCount       = document.getElementById('xp-count');
const stageName     = document.getElementById('stage-name');
const stageNum      = document.getElementById('stage-num');
const clearBtn      = document.getElementById('clear-btn');
const toast         = document.getElementById('toast');

// Init
function init() {
  loadState();
  renderAll();
  taskInput.focus();
}

// Persistence
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify({ currentStage, completedCount }));
}

function loadState() {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t) tasks = JSON.parse(t);
    const p = localStorage.getItem(STAGE_STORAGE_KEY);
    if (p) { 
      const d = JSON.parse(p); 
      currentStage = d.currentStage || 1; 
      completedCount = d.completedCount || 0; 
    }
  } catch(e) {
    console.error('Error loading state:', e);
  }
}

// Render
function renderAll() {
  renderTasks();
  updateDragonUI(false);
}

function renderTasks() {
  taskList.innerHTML = '';
  
  if (!tasks.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = '[ no quests yet — add one above! ]';
    taskList.appendChild(li);
    updateFooter();
    return;
  }
  
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const cb = document.createElement('div');
    cb.className = 'cb';
    cb.innerHTML = '<div class="cb-check"></div>';

    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = task.text;

    const del = document.createElement('button');
    del.className = 'del-btn';
    del.textContent = '✕';
    del.title = 'Delete';
    del.addEventListener('click', e => { 
      e.stopPropagation(); 
      deleteTask(task.id); 
    });

    li.addEventListener('click', () => toggleTask(task.id));
    
    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(del);
    taskList.appendChild(li);
  });
  
  updateFooter();
}

function updateFooter() {
  const r = tasks.filter(t => !t.done).length;
  document.getElementById('task-count-label').textContent =
    r === 1 ? '1 quest remaining' : r + ' quests remaining';
}

// Task actions
function addTask() {
  const text = taskInput.value.trim();
  if (!text) { 
    shakeInput(); 
    return; 
  }
  
  tasks.unshift({ id: Date.now().toString(), text, done: false });
  taskInput.value = '';
  saveState();
  renderTasks();
  
  requestAnimationFrame(() => {
    const first = taskList.querySelector('.task-item');
    if (first) { 
      first.style.background = 'rgba(124,58,237,0.07)'; 
      setTimeout(() => first.style.background = '', 500); 
    }
  });
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  const wasDone = task.done;
  task.done = !task.done;
  
  if (task.done && !wasDone) {
    completedCount++;
    const newStage = Math.min(1 + Math.floor(completedCount / TASKS_PER_STAGE), 6);
    const evolved = newStage > currentStage;
    currentStage = newStage;
    
    saveState();
    renderTasks();
    
    if (evolved) { 
      updateDragonUI(true, 'evolve'); 
      showToast('✦ ' + STAGE_NAMES[currentStage-1] + '!'); 
    }
    else { 
      updateDragonUI(true, 'pop'); 
      spawnSparkles(7); 
    }
  } else if (wasDone && !task.done) {
    completedCount = Math.max(0, completedCount - 1);
    currentStage = Math.max(1, Math.min(1 + Math.floor(completedCount / TASKS_PER_STAGE), 6));
    
    saveState();
    renderTasks();
    updateDragonUI(false);
  } else {
    saveState();
    renderTasks();
    updateDragonUI(false);
  }
}

function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task && task.done) {
    completedCount = Math.max(0, completedCount - 1);
    currentStage = Math.max(1, Math.min(1 + Math.floor(completedCount / TASKS_PER_STAGE), 6));
  }
  
  tasks = tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
  updateDragonUI(false);
}

function clearDone() {
  const n = tasks.filter(t => t.done).length;
  if (!n) return;
  
  tasks = tasks.filter(t => !t.done);
  completedCount = tasks.filter(t => t.done).length;
  currentStage = Math.max(1, Math.min(1 + Math.floor(completedCount / TASKS_PER_STAGE), 6));
  
  saveState();
  renderTasks();
  updateDragonUI(false);
  showToast(n + ' quest' + (n>1?'s':'') + ' cleared!');
}

// Dragon UI
function updateDragonUI(animate, type) {
  dragonSprite.src = DRAGON_STAGES[currentStage - 1];
  stageName.textContent = STAGE_NAMES[currentStage - 1];
  stageNum.textContent  = 'Stage ' + currentStage + '/6';

  const pct = currentStage >= 6 ? 100
    : ((completedCount % TASKS_PER_STAGE) / TASKS_PER_STAGE) * 100;
  xpFill.style.width = pct + '%';
  xpCount.textContent = currentStage >= 6 ? '✓'
    : (completedCount % TASKS_PER_STAGE) + '/' + TASKS_PER_STAGE;

  for (let i = 1; i <= 6; i++) {
    document.getElementById('dot-'+i).classList.toggle('active', i <= currentStage);
  }

  if (animate) {
    dragonWrap.classList.remove('pop','evolve');
    void dragonWrap.offsetWidth;
    dragonWrap.classList.add(type);
    spawnSparkles(type === 'evolve' ? 16 : 7);
    dragonWrap.addEventListener('animationend', function() { 
      dragonWrap.classList.remove('pop','evolve'); 
    }, {once:true});
  }
}

// Sparkles
function spawnSparkles(n) {
  sparklesEl.innerHTML = '';
  var cols = ['#f59e0b','#ec4899','#7c3aed','#06b6d4','#22c55e','#f97316','#a855f7'];
  
  for (var i = 0; i < n; i++) {
    (function(index) {
      setTimeout(function() {
        var s = document.createElement('div');
        s.className = 'sparkle';
        var angle = Math.random() * 360;
        var dist = 30 + Math.random() * 55;
        var rad = angle * Math.PI / 180;
        
        s.style.setProperty('--tx', Math.cos(rad)*dist + 'px');
        s.style.setProperty('--ty', Math.sin(rad)*dist - 15 + 'px');
        s.style.setProperty('--rot', (Math.random()-0.5)*360+'deg');
        s.style.background = cols[Math.floor(Math.random()*cols.length)];
        
        var sz = 4 + Math.random() * 5;
        s.style.width = sz + 'px';
        s.style.height = sz + 'px';
        s.style.left = (35 + Math.random()*30) + '%';
        s.style.top  = (30 + Math.random()*30) + '%';
        
        sparklesEl.appendChild(s);
        s.addEventListener('animationend', function() { s.remove(); });
      }, index * 45);
    })(i);
  }
}

// Toast
var toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2200);
}

// Input shake
function shakeInput() {
  taskInput.style.color = '#ef4444';
  taskInput.animate([
    {transform:'translateX(0)'},
    {transform:'translateX(-5px)'},
    {transform:'translateX(5px)'},
    {transform:'translateX(-3px)'},
    {transform:'translateX(3px)'},
    {transform:'translateX(0)'}
  ], {duration:280});
  setTimeout(function() { taskInput.style.color = ''; }, 400);
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', function(e) { if(e.key==='Enter') addTask(); });
clearBtn.addEventListener('click', clearDone);

// Start the application
init();
